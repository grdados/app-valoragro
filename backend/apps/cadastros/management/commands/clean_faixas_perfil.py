from django.core.management.base import BaseCommand
from django.db import transaction

from apps.cadastros.models import FaixaComissaoCoordenador, FaixaComissaoVendedor


def _overlaps(a_min, a_max, b_min, b_max):
    return a_min <= b_max and a_max >= b_min


def _clean_model(model, stdout, dry_run=False):
    ativos = list(model.objects.filter(ativo=True).order_by("-id"))
    manter = []
    desativar = []

    for faixa in ativos:
        conflito = any(
            _overlaps(
                faixa.valor_min,
                faixa.valor_max,
                k.valor_min,
                k.valor_max,
            )
            for k in manter
        )
        if conflito:
            desativar.append(faixa)
        else:
            manter.append(faixa)

    stdout.write(f"\n[{model.__name__}] ativos={len(ativos)} manter={len(manter)} desativar={len(desativar)}")

    for faixa in desativar:
        stdout.write(
            f" - desativar ID {faixa.id}: {faixa.valor_min} .. {faixa.valor_max} | "
            f"{faixa.percentual_total}% | {faixa.qtd_parcelas} parcelas"
        )

    if desativar and not dry_run:
        model.objects.filter(id__in=[f.id for f in desativar]).update(ativo=False)

    return len(desativar)


class Command(BaseCommand):
    help = (
        "Limpa automaticamente faixas sobrepostas de comissão por perfil "
        "(vendedor e coordenador), mantendo sempre a faixa ativa mais recente (ID maior)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Apenas mostra o que seria alterado, sem salvar no banco.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        dry_run = options.get("dry_run", False)

        if dry_run:
            self.stdout.write(self.style.WARNING("Modo dry-run: nenhuma alteração será salva."))
        else:
            self.stdout.write(self.style.SUCCESS("Aplicando limpeza automática de faixas sobrepostas..."))

        total_desativadas = 0
        total_desativadas += _clean_model(FaixaComissaoVendedor, self.stdout, dry_run=dry_run)
        total_desativadas += _clean_model(FaixaComissaoCoordenador, self.stdout, dry_run=dry_run)

        if dry_run:
            transaction.set_rollback(True)
            self.stdout.write(self.style.WARNING(f"\nDry-run concluído. Registros que seriam desativados: {total_desativadas}"))
        else:
            self.stdout.write(self.style.SUCCESS(f"\nConcluído. Registros desativados: {total_desativadas}"))

