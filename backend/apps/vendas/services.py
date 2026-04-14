from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from dateutil.relativedelta import relativedelta
from apps.cadastros.models import Consorcio, Assembleia


def calcular_primeiro_vencimento(data_venda: date, consorcio: Consorcio) -> date:
    assembleia = Assembleia.objects.filter(
        consorcio=consorcio,
        data_assembleia__gte=data_venda
    ).order_by("data_assembleia").first()

    if assembleia:
        return (assembleia.data_assembleia + relativedelta(months=1)).replace(day=10)

    if data_venda.day <= 18:
        primeiro = data_venda.replace(day=1) + relativedelta(months=1)
    else:
        primeiro = data_venda.replace(day=1) + relativedelta(months=2)

    return primeiro.replace(day=10)


def _get_faixa(consorcio: Consorcio, valor_bem: Decimal, perfil: str):
    return (
        consorcio.faixas.filter(
            ativo=True,
            perfil=perfil,
            valor_min__lte=valor_bem,
            valor_max__gte=valor_bem,
        )
        .order_by("valor_min")
        .first()
    )


def identificar_faixa(coban_sigla: str, tipo_bem_nome: str, valor_bem: Decimal, data_venda: date):
    consorcios = Consorcio.objects.filter(
        coban__sigla=coban_sigla,
        tipo_bem__nome=tipo_bem_nome,
        vigencia_inicio__lte=data_venda,
        vigencia_fim__gte=data_venda,
        ativo=True,
    ).prefetch_related("faixas")

    resultado = []
    faixa_encontrada = None

    for consorcio in consorcios:
        faixa_vendedor = _get_faixa(consorcio, valor_bem, "vendedor")
        if not faixa_vendedor:
            continue

        if faixa_encontrada is None:
            faixa_encontrada = faixa_vendedor

        resultado.append({
            "id": consorcio.id,
            "nome": consorcio.nome,
            "qtd_parcelas": faixa_vendedor.qtd_parcelas,
            "faixa_id": faixa_vendedor.id,
            "percentual_total": float(faixa_vendedor.percentual_total),
        })

    return faixa_encontrada, resultado


def calcular_plano_parcelas(valor_bem: Decimal, consorcio: Consorcio, primeiro_vencimento: date, perfil: str = "vendedor"):
    faixa = _get_faixa(consorcio, valor_bem, perfil)
    if not faixa:
        return [], Decimal("0")

    qtd_parcelas = int(faixa.qtd_parcelas)
    percentual_total = Decimal(str(faixa.percentual_total))
    valor_total = (valor_bem * percentual_total / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    valor_base = (valor_total / Decimal(qtd_parcelas)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    parcelas = []
    acumulado = Decimal("0")

    for i in range(qtd_parcelas):
        vencimento = primeiro_vencimento + relativedelta(months=i)
        valor_parcela = valor_base if i < qtd_parcelas - 1 else (valor_total - acumulado)
        acumulado += valor_parcela
        percentual_parcela = (percentual_total / Decimal(qtd_parcelas)).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
        parcelas.append({
            "numero_parcela": i + 1,
            "data_vencimento": vencimento.isoformat(),
            "percentual": float(percentual_parcela),
            "valor": float(valor_parcela),
        })

    return parcelas, valor_total
