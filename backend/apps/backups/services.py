import hashlib
import json
import os
import shutil
import tempfile
import zipfile
from datetime import timedelta
from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management import call_command
from django.utils import timezone

from .models import BackupArquivo, BackupSettings


EXCLUDE_DUMPDATA_MODELS = [
    "contenttypes",
    "auth.permission",
    "sessions",
    "backups.backuparquivo",
]


def _ensure_media_dirs():
    media_root = Path(settings.MEDIA_ROOT)
    media_root.mkdir(parents=True, exist_ok=True)
    (media_root / "backups").mkdir(parents=True, exist_ok=True)


def _sha256_file(file_path: Path) -> str:
    hasher = hashlib.sha256()
    with file_path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def _build_dump_json(output_path: Path):
    args = [
        "--natural-foreign",
        "--natural-primary",
        "--indent",
        "2",
    ]
    for excluded in EXCLUDE_DUMPDATA_MODELS:
        args.extend(["--exclude", excluded])
    with output_path.open("w", encoding="utf-8") as fh:
        call_command("dumpdata", *args, stdout=fh)


def _copy_media_snapshot(target_dir: Path):
    media_root = Path(settings.MEDIA_ROOT)
    if not media_root.exists():
        return
    target_dir.mkdir(parents=True, exist_ok=True)
    for item in media_root.iterdir():
        if item.name == "backups":
            continue
        destination = target_dir / item.name
        if item.is_dir():
            shutil.copytree(item, destination, dirs_exist_ok=True)
        else:
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(item, destination)


def _zip_directory(source_dir: Path, zip_path: Path):
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for file_path in source_dir.rglob("*"):
            if file_path.is_file():
                archive.write(file_path, arcname=file_path.relative_to(source_dir))


def _save_uploaded_to_temp(uploaded_file, target_path: Path):
    with target_path.open("wb") as out:
        for chunk in uploaded_file.chunks():
            out.write(chunk)


def _restore_media(snapshot_media_dir: Path):
    media_root = Path(settings.MEDIA_ROOT)
    media_root.mkdir(parents=True, exist_ok=True)
    backups_dir = media_root / "backups"
    backups_dir.mkdir(parents=True, exist_ok=True)

    for item in media_root.iterdir():
        if item.name == "backups":
            continue
        if item.is_dir():
            shutil.rmtree(item, ignore_errors=True)
        else:
            item.unlink(missing_ok=True)

    if not snapshot_media_dir.exists():
        return

    for item in snapshot_media_dir.iterdir():
        destination = media_root / item.name
        if item.is_dir():
            shutil.copytree(item, destination, dirs_exist_ok=True)
        else:
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(item, destination)


def get_or_create_settings() -> BackupSettings:
    return BackupSettings.get_solo()


def create_backup_archive(*, criado_por=None, origem=BackupArquivo.ORIGEM_MANUAL, observacao="") -> BackupArquivo:
    _ensure_media_dirs()
    now_local = timezone.localtime()
    filename = f"backup_valoragro_{now_local:%Y%m%d_%H%M%S}.zip"

    with tempfile.TemporaryDirectory(prefix="valoragro_backup_") as tmp_dir:
        snapshot_dir = Path(tmp_dir)
        dump_path = snapshot_dir / "database.json"
        media_snapshot_dir = snapshot_dir / "media"
        metadata_path = snapshot_dir / "manifest.json"

        _build_dump_json(dump_path)
        _copy_media_snapshot(media_snapshot_dir)
        metadata = {
            "generated_at": now_local.isoformat(),
            "timezone": str(timezone.get_current_timezone()),
            "version": "1.0",
            "file": filename,
        }
        metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")

        fd, temp_zip = tempfile.mkstemp(prefix="valoragro_backup_", suffix=".zip")
        os.close(fd)
        zip_path = Path(temp_zip)
        try:
            _zip_directory(snapshot_dir, zip_path)
            registro = BackupArquivo(
                nome_arquivo=filename,
                tamanho_bytes=zip_path.stat().st_size,
                hash_sha256=_sha256_file(zip_path),
                origem=origem,
                observacao=observacao,
                criado_por=criado_por,
            )
            with zip_path.open("rb") as fh:
                registro.arquivo.save(filename, File(fh), save=False)
            registro.save()
            return registro
        finally:
            zip_path.unlink(missing_ok=True)


def restore_from_backup(*, backup_path: Path, restaurado_por=None):
    _ensure_media_dirs()
    with tempfile.TemporaryDirectory(prefix="valoragro_restore_") as tmp_dir:
        tmp_path = Path(tmp_dir)
        with zipfile.ZipFile(backup_path, "r") as archive:
            archive.extractall(tmp_path)

        dump_path = tmp_path / "database.json"
        if not dump_path.exists():
            raise ValueError("Arquivo de backup invalido: database.json nao encontrado.")

        media_snapshot_dir = tmp_path / "media"
        _restore_media(media_snapshot_dir)

        call_command("flush", verbosity=0, interactive=False)
        call_command("loaddata", str(dump_path), verbosity=0)

        return {"restaurado_por_id": getattr(restaurado_por, "id", None)}


def restore_from_uploaded_file(*, uploaded_file, restaurado_por=None):
    with tempfile.TemporaryDirectory(prefix="valoragro_restore_upload_") as tmp_dir:
        temp_zip = Path(tmp_dir) / "uploaded_backup.zip"
        _save_uploaded_to_temp(uploaded_file, temp_zip)
        return restore_from_backup(backup_path=temp_zip, restaurado_por=restaurado_por)


def process_scheduled_backups(*, referencia=None, actor=None):
    settings_obj = get_or_create_settings()
    now = referencia or timezone.now()

    if not settings_obj.ativo:
        return {"executado": False, "motivo": "agendamento_desativado"}

    if not settings_obj.proxima_execucao:
        settings_obj.proxima_execucao = settings_obj.calcular_proxima_execucao(referencia=now)
        settings_obj.save(update_fields=["proxima_execucao", "atualizado_em"])

    if settings_obj.proxima_execucao > now:
        return {"executado": False, "motivo": "ainda_nao_chegou"}

    registro = create_backup_archive(
        criado_por=actor,
        origem=BackupArquivo.ORIGEM_AGENDADO,
        observacao="Backup diario agendado",
    )
    settings_obj.ultima_execucao = now
    settings_obj.proxima_execucao = settings_obj.calcular_proxima_execucao(
        referencia=now + timedelta(minutes=1)
    )
    settings_obj.save(update_fields=["ultima_execucao", "proxima_execucao", "atualizado_em"])
    cleanup_old_backups(settings_obj.manter_dias)
    return {"executado": True, "registro_id": registro.id}


def cleanup_old_backups(manter_dias: int):
    if manter_dias <= 0:
        return
    limite = timezone.now() - timedelta(days=manter_dias)
    antigos = BackupArquivo.objects.filter(criado_em__lt=limite)
    for backup in antigos:
        if backup.arquivo:
            backup.arquivo.delete(save=False)
    antigos.delete()
