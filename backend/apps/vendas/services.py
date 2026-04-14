from datetime import date
from decimal import Decimal
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


def _get_percentuais_by_perfil(faixa, perfil: str):
    if perfil == "coordenador":
        return faixa.percentuais_coordenador or []
    if perfil == "supervisor":
        return faixa.percentuais_supervisor or []
    if perfil == "vendedor":
        return faixa.percentuais_vendedor or faixa.percentuais or []
    return faixa.percentuais or []


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
        for faixa in consorcio.faixas.filter(ativo=True):
            if faixa.valor_min <= valor_bem <= faixa.valor_max:
                if faixa_encontrada is None:
                    faixa_encontrada = faixa
                resultado.append({
                    "id": consorcio.id,
                    "nome": consorcio.nome,
                    "qtd_parcelas": consorcio.qtd_parcelas,
                    "faixa_id": faixa.id,
                    "percentuais": _get_percentuais_by_perfil(faixa, "vendedor"),
                })

    return faixa_encontrada, resultado


def calcular_plano_parcelas(valor_bem: Decimal, consorcio: Consorcio, primeiro_vencimento: date, perfil: str = "vendedor"):
    faixas = consorcio.faixas.filter(ativo=True)
    faixa = None
    for f in faixas:
        if f.valor_min <= valor_bem <= f.valor_max:
            faixa = f
            break

    if not faixa:
        return [], Decimal("0")

    parcelas = []
    total = Decimal("0")
    percentuais = _get_percentuais_by_perfil(faixa, perfil)

    for i, percentual in enumerate(percentuais):
        valor_parcela = (valor_bem * Decimal(str(percentual)) / Decimal("100")).quantize(Decimal("0.01"))
        vencimento = primeiro_vencimento + relativedelta(months=i)
        total += valor_parcela
        parcelas.append({
            "numero_parcela": i + 1,
            "data_vencimento": vencimento.isoformat(),
            "percentual": percentual,
            "valor": float(valor_parcela),
        })

    return parcelas, total
