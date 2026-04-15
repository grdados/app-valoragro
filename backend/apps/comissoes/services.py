from datetime import date
from decimal import Decimal
from django.db import models

from .models import ParcelaComissao, LogAlteracao, BonusMensalCoordenador
from apps.vendas.models import Venda
from apps.vendas.services import calcular_primeiro_vencimento, calcular_plano_parcelas

BONUS_COORDENADOR_LIMITE = Decimal("3500000.00")
BONUS_COORDENADOR_PERCENTUAL = Decimal("0.2")


def _to_decimal(value) -> Decimal:
    return Decimal(str(value))


def _map_por_numero(parcelas_data):
    return {int(p["numero_parcela"]): p for p in parcelas_data}


def _atualizar_bonus_coordenador(venda: Venda):
    coordenador = venda.vendedor.coordenador
    ano = venda.data_venda.year
    mes = venda.data_venda.month

    total_vendas_mes = (
        Venda.objects.filter(
            vendedor__coordenador=coordenador,
            data_venda__year=ano,
            data_venda__month=mes,
        )
        .exclude(status="cancelada")
        .aggregate(total=models.Sum("valor_bem"))
        .get("total")
        or Decimal("0")
    )

    bonus = BonusMensalCoordenador.objects.filter(coordenador=coordenador, ano=ano, mes=mes).first()

    if total_vendas_mes > BONUS_COORDENADOR_LIMITE:
        valor_bonus = (total_vendas_mes * BONUS_COORDENADOR_PERCENTUAL / Decimal("100")).quantize(Decimal("0.01"))
        if bonus:
            bonus.total_vendas_mes = total_vendas_mes
            bonus.percentual_bonus = BONUS_COORDENADOR_PERCENTUAL
            bonus.valor_bonus = valor_bonus
            bonus.save(update_fields=["total_vendas_mes", "percentual_bonus", "valor_bonus", "atualizado_em"])
        else:
            BonusMensalCoordenador.objects.create(
                coordenador=coordenador,
                ano=ano,
                mes=mes,
                total_vendas_mes=total_vendas_mes,
                percentual_bonus=BONUS_COORDENADOR_PERCENTUAL,
                valor_bonus=valor_bonus,
            )
    elif bonus:
        bonus.delete()


def gerar_parcelas(venda: Venda, usuario=None) -> list:
    if venda.parcelas.exists():
        venda.parcelas.all().delete()

    primeiro_vencimento = calcular_primeiro_vencimento(venda.data_venda, venda.consorcio)

    supervisor_data, total_supervisor_base = calcular_plano_parcelas(
        venda.valor_bem,
        venda.consorcio,
        primeiro_vencimento,
        perfil="supervisor",
    )
    vendedor_data, total_vendedor = calcular_plano_parcelas(
        venda.valor_bem,
        venda.consorcio,
        primeiro_vencimento,
        perfil="vendedor",
    )
    coordenador_data, _ = calcular_plano_parcelas(
        venda.valor_bem,
        venda.consorcio,
        primeiro_vencimento,
        perfil="coordenador",
    )

    if not supervisor_data:
        raise ValueError("Não há faixa de comissão do Supervisor para este consórcio e valor.")
    if not vendedor_data:
        raise ValueError("Não há faixa de comissão do Vendedor para o valor da venda.")
    if not coordenador_data:
        raise ValueError("Não há faixa de comissão do Coordenador para o valor da venda.")

    sup_map = _map_por_numero(supervisor_data)
    ven_map = _map_por_numero(vendedor_data)
    coo_map = _map_por_numero(coordenador_data)

    numeros = sorted(set(sup_map.keys()) | set(ven_map.keys()) | set(coo_map.keys()))

    parcelas = []
    for numero in numeros:
        supervisor_item = sup_map.get(numero)
        vendedor_item = ven_map.get(numero)
        coordenador_item = coo_map.get(numero)

        valor_supervisor_bruto = _to_decimal(supervisor_item["valor"]) if supervisor_item else Decimal("0")
        valor_vendedor = _to_decimal(vendedor_item["valor"]) if vendedor_item else Decimal("0")
        valor_coordenador = _to_decimal(coordenador_item["valor"]) if coordenador_item else Decimal("0")

        valor_supervisor_liquido = (valor_supervisor_bruto - valor_vendedor - valor_coordenador).quantize(Decimal("0.01"))
        if valor_supervisor_liquido < 0:
            raise ValueError(
                "Configuração inválida: comissão do Supervisor ficou negativa após descontar Coordenador e Vendedor."
            )

        if vendedor_item:
            parcelas.append(
                ParcelaComissao.objects.create(
                    venda=venda,
                    perfil_comissao="vendedor",
                    numero_parcela=numero,
                    data_vencimento=vendedor_item["data_vencimento"],
                    valor=valor_vendedor,
                    percentual=_to_decimal(vendedor_item["percentual"]),
                    status="pendente",
                )
            )

        if coordenador_item:
            parcelas.append(
                ParcelaComissao.objects.create(
                    venda=venda,
                    perfil_comissao="coordenador",
                    numero_parcela=numero,
                    data_vencimento=coordenador_item["data_vencimento"],
                    valor=valor_coordenador,
                    percentual=_to_decimal(coordenador_item["percentual"]),
                    status="pendente",
                )
            )

        percentual_supervisor_liquido = Decimal("0")
        if venda.valor_bem and venda.valor_bem > 0:
            percentual_supervisor_liquido = (
                valor_supervisor_liquido * Decimal("100") / venda.valor_bem
            ).quantize(Decimal("0.0001"))

        parcelas.append(
            ParcelaComissao.objects.create(
                venda=venda,
                perfil_comissao="supervisor",
                numero_parcela=numero,
                data_vencimento=(supervisor_item or vendedor_item or coordenador_item)["data_vencimento"],
                valor=valor_supervisor_liquido,
                percentual=percentual_supervisor_liquido,
                status="pendente",
            )
        )

    venda.valor_total_comissao = total_vendedor
    venda.save(update_fields=["valor_total_comissao"])

    _ = total_supervisor_base  # valor mantido para rastreabilidade futura
    _atualizar_bonus_coordenador(venda)

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
