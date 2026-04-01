from datetime import date
from decimal import Decimal
from .models import ParcelaComissao, LogAlteracao
from apps.vendas.models import Venda
from apps.vendas.services import calcular_primeiro_vencimento, calcular_plano_parcelas


def gerar_parcelas(venda: Venda, usuario=None) -> list:
    if venda.parcelas.exists():
        venda.parcelas.all().delete()

    primeiro_vencimento = calcular_primeiro_vencimento(venda.data_venda, venda.consorcio)
    parcelas_data, total = calcular_plano_parcelas(venda.valor_bem, venda.consorcio, primeiro_vencimento)

    parcelas = []
    for p in parcelas_data:
        parcela = ParcelaComissao.objects.create(
            venda=venda,
            numero_parcela=p["numero_parcela"],
            data_vencimento=p["data_vencimento"],
            valor=Decimal(str(p["valor"])),
            percentual=Decimal(str(p["percentual"])),
            status="pendente",
        )
        parcelas.append(parcela)

    venda.valor_total_comissao = total
    venda.save(update_fields=["valor_total_comissao"])

    return parcelas


def atualizar_status_vencidas():
    hoje = date.today()
    atualizadas = ParcelaComissao.objects.filter(
        status="pendente",
        data_vencimento__lt=hoje,
    ).update(status="vencido")
    return atualizadas


def alterar_status(parcela: ParcelaComissao, novo_status: str, usuario, observacao: str = "", status_contrato_banco: str = None) -> ParcelaComissao:
    status_anterior = parcela.status
    parcela.status = novo_status
    if novo_status == "pago":
        parcela.data_pagamento = date.today()
    else:
        parcela.data_pagamento = None
    if status_contrato_banco:
        parcela.status_contrato_banco = status_contrato_banco
    parcela.save(update_fields=["status", "data_pagamento", "status_contrato_banco", "atualizado_em"])

    LogAlteracao.objects.create(
        parcela=parcela,
        usuario=usuario,
        status_anterior=status_anterior,
        status_novo=novo_status,
        observacao=observacao,
    )
    return parcela
