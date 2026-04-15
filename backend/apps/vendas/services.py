from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from dateutil.relativedelta import relativedelta

from apps.cadastros.models import (
    Assembleia,
    Consorcio,
    FaixaComissaoCoordenador,
    FaixaComissaoVendedor,
)


def calcular_primeiro_vencimento(data_venda: date, consorcio: Consorcio) -> date:
    assembleia = Assembleia.objects.filter(
        consorcio=consorcio,
        data_assembleia__gte=data_venda,
    ).order_by("data_assembleia").first()

    if assembleia:
        return (assembleia.data_assembleia + relativedelta(months=1)).replace(day=10)

    if data_venda.day <= 18:
        primeiro = data_venda.replace(day=1) + relativedelta(months=1)
    else:
        primeiro = data_venda.replace(day=1) + relativedelta(months=2)

    return primeiro.replace(day=10)


def _get_faixa_supervisor(consorcio: Consorcio, valor_bem: Decimal):
    return (
        consorcio.faixas.filter(
            ativo=True,
            valor_min__lte=valor_bem,
            valor_max__gte=valor_bem,
        )
        .order_by("valor_min")
        .first()
    )


def obter_indice_faixa_supervisor(consorcio: Consorcio, valor_bem: Decimal):
    faixas = list(
        consorcio.faixas.filter(ativo=True)
        .order_by("valor_min", "id")
    )
    for idx, faixa in enumerate(faixas, start=1):
        if faixa.valor_min <= valor_bem <= faixa.valor_max:
            return idx
    return None


def _get_faixa_tabela(model, valor_bem: Decimal, indice_faixa: int | None = None):
    # 1) Regra principal: pega a faixa que cobre o valor e é mais específica.
    # Em caso de sobreposição, prioriza maior valor_min (faixa mais "alta")
    # e depois ID mais recente.
    candidatas = list(
        model.objects.filter(
            ativo=True,
            valor_min__lte=valor_bem,
            valor_max__gte=valor_bem,
        )
    )
    if candidatas:
        candidatas.sort(
            key=lambda f: (
                f.valor_min,  # maior primeiro
                -(f.valor_max - f.valor_min),  # menor intervalo primeiro
                f.id,  # mais recente primeiro
            ),
            reverse=True,
        )
        return candidatas[0]

    # 2) Fallback por índice da faixa do consórcio (compatibilidade).
    if indice_faixa is not None:
        faixas = list(model.objects.filter(ativo=True).order_by("valor_min", "id"))
        if faixas:
            idx = max(0, min(indice_faixa - 1, len(faixas) - 1))
            return faixas[idx]

    return (
        model.objects.filter(
            ativo=True,
            valor_min__lte=valor_bem,
            valor_max__gte=valor_bem,
        )
        # Prioriza o cadastro mais recente quando existirem faixas sobrepostas.
        .order_by("-id")
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
        faixa_supervisor = _get_faixa_supervisor(consorcio, valor_bem)
        if not faixa_supervisor:
            continue

        percentuais = [Decimal(str(p)) for p in (faixa_supervisor.percentuais or [])]
        if not percentuais:
            continue

        if faixa_encontrada is None:
            faixa_encontrada = faixa_supervisor

        percentual_total = sum(percentuais)
        resultado.append(
            {
                "id": consorcio.id,
                "nome": consorcio.nome,
                "qtd_parcelas": len(percentuais),
                "faixa_id": faixa_supervisor.id,
                "percentual_total": float(percentual_total),
            }
        )

    return faixa_encontrada, resultado


def calcular_plano_supervisor(valor_bem: Decimal, consorcio: Consorcio, primeiro_vencimento: date):
    faixa = _get_faixa_supervisor(consorcio, valor_bem)
    if not faixa:
        return [], Decimal("0")

    percentuais = [Decimal(str(p)) for p in (faixa.percentuais or [])]
    if not percentuais:
        return [], Decimal("0")

    parcelas = []
    total = Decimal("0")

    for i, percentual in enumerate(percentuais):
        valor_parcela = (valor_bem * percentual / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total += valor_parcela
        parcelas.append(
            {
                "numero_parcela": i + 1,
                "data_vencimento": (primeiro_vencimento + relativedelta(months=i)).isoformat(),
                "percentual": float(percentual),
                "valor": float(valor_parcela),
            }
        )

    return parcelas, total


def calcular_plano_por_tabela(valor_bem: Decimal, primeiro_vencimento: date, perfil: str, indice_faixa: int | None = None):
    model = FaixaComissaoVendedor if perfil == "vendedor" else FaixaComissaoCoordenador
    faixa = _get_faixa_tabela(model, valor_bem, indice_faixa=indice_faixa)
    if not faixa:
        return [], Decimal("0")

    qtd_parcelas = int(faixa.qtd_parcelas)
    percentual_total = Decimal(str(faixa.percentual_total))
    valor_total = (valor_bem * percentual_total / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    valor_base = (valor_total / Decimal(qtd_parcelas)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    percentual_parcela = (percentual_total / Decimal(qtd_parcelas)).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)

    parcelas = []
    acumulado = Decimal("0")
    for i in range(qtd_parcelas):
        vencimento = primeiro_vencimento + relativedelta(months=i)
        valor_parcela = valor_base if i < qtd_parcelas - 1 else (valor_total - acumulado)
        acumulado += valor_parcela
        parcelas.append(
            {
                "numero_parcela": i + 1,
                "data_vencimento": vencimento.isoformat(),
                "percentual": float(percentual_parcela),
                "valor": float(valor_parcela),
            }
        )

    return parcelas, valor_total


def calcular_plano_parcelas(
    valor_bem: Decimal,
    consorcio: Consorcio,
    primeiro_vencimento: date,
    perfil: str = "vendedor",
    indice_faixa: int | None = None,
):
    if perfil == "supervisor":
        return calcular_plano_supervisor(valor_bem, consorcio, primeiro_vencimento)
    return calcular_plano_por_tabela(valor_bem, primeiro_vencimento, perfil, indice_faixa=indice_faixa)
