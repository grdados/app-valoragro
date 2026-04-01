from django.core.management.base import BaseCommand
from apps.comissoes.services import atualizar_status_vencidas


class Command(BaseCommand):
    help = "Atualiza para 'Vencido' todas as parcelas pendentes com data de vencimento anterior a hoje"

    def handle(self, *args, **options):
        total = atualizar_status_vencidas()
        self.stdout.write(self.style.SUCCESS(f"{total} parcela(s) marcada(s) como Vencido."))
