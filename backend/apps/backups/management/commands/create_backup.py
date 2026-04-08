from django.core.management.base import BaseCommand

from apps.backups.models import BackupArquivo
from apps.backups.services import create_backup_archive, get_or_create_settings, cleanup_old_backups


class Command(BaseCommand):
    help = "Gera um arquivo de backup do banco + media."

    def add_arguments(self, parser):
        parser.add_argument(
            "--agendado",
            action="store_true",
            help="Marca o backup como agendado.",
        )

    def handle(self, *args, **options):
        origem = BackupArquivo.ORIGEM_AGENDADO if options["agendado"] else BackupArquivo.ORIGEM_MANUAL
        backup = create_backup_archive(
            origem=origem,
            observacao="Backup gerado via comando de gerenciamento",
        )
        config = get_or_create_settings()
        cleanup_old_backups(config.manter_dias)
        self.stdout.write(self.style.SUCCESS(f"Backup criado: {backup.nome_arquivo}"))
