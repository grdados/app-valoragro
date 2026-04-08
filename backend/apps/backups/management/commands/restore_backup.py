from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from apps.backups.models import BackupArquivo
from apps.backups.services import restore_from_backup


class Command(BaseCommand):
    help = "Restaura um backup por ID cadastrado ou por caminho do arquivo zip."

    def add_arguments(self, parser):
        parser.add_argument("--id", type=int, help="ID do backup salvo no sistema.")
        parser.add_argument("--file", type=str, help="Caminho absoluto para arquivo .zip.")

    def handle(self, *args, **options):
        backup_id = options.get("id")
        backup_file = options.get("file")

        if not backup_id and not backup_file:
            raise CommandError("Informe --id ou --file.")

        if backup_id:
            try:
                registro = BackupArquivo.objects.get(pk=backup_id)
            except BackupArquivo.DoesNotExist as exc:
                raise CommandError("Backup informado nao existe.") from exc
            if not registro.arquivo:
                raise CommandError("Backup sem arquivo associado.")
            backup_path = Path(registro.arquivo.path)
        else:
            backup_path = Path(backup_file)

        if not backup_path.exists():
            raise CommandError(f"Arquivo nao encontrado: {backup_path}")

        restore_from_backup(backup_path=backup_path)
        self.stdout.write(self.style.SUCCESS("Backup restaurado com sucesso."))
