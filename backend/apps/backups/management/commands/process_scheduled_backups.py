from django.core.management.base import BaseCommand

from apps.backups.services import process_scheduled_backups


class Command(BaseCommand):
    help = "Processa o agendamento diario de backup, caso esteja no horario."

    def handle(self, *args, **options):
        result = process_scheduled_backups()
        if result.get("executado"):
            self.stdout.write(self.style.SUCCESS("Backup agendado executado com sucesso."))
        else:
            motivo = result.get("motivo", "nenhum")
            self.stdout.write(f"Nada a executar agora. Motivo: {motivo}")
