from django.db import models
from apps.vendas.models import Venda
from apps.cadastros.models import Coordenador


class ParcelaComissao(models.Model):
    STATUS_CHOICES = [
        ("pendente", "Pendente"),
        ("pago", "Pago"),
        ("vencido", "Vencido"),
    ]
    STATUS_BANCO_CHOICES = [
        ("ok", "OK"),
        ("inadimplente", "Inadimplente"),
    ]
    PERFIL_CHOICES = [
        ("vendedor", "Vendedor"),
        ("coordenador", "Coordenador"),
        ("supervisor", "Supervisor"),
    ]

    venda = models.ForeignKey(Venda, on_delete=models.CASCADE, related_name="parcelas")
    perfil_comissao = models.CharField(max_length=20, choices=PERFIL_CHOICES, default="vendedor")
    numero_parcela = models.PositiveIntegerField()
    data_vencimento = models.DateField()
    valor = models.DecimalField(max_digits=15, decimal_places=2)
    percentual = models.DecimalField(max_digits=6, decimal_places=4, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pendente")
    status_contrato_banco = models.CharField(max_length=20, choices=STATUS_BANCO_CHOICES, default="ok")
    data_pagamento = models.DateField(null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Parcela de Comissão"
        verbose_name_plural = "Parcelas de Comissão"
        ordering = ["venda", "perfil_comissao", "numero_parcela"]
        unique_together = [["venda", "perfil_comissao", "numero_parcela"]]

    def __str__(self):
        return f"{self.venda.numero_contrato} - {self.perfil_comissao} - Parcela {self.numero_parcela}"


class LogAlteracao(models.Model):
    parcela = models.ForeignKey(ParcelaComissao, on_delete=models.CASCADE, related_name="logs")
    usuario = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True)
    status_anterior = models.CharField(max_length=20)
    status_novo = models.CharField(max_length=20)
    observacao = models.TextField(blank=True)
    data_hora = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Log de Alteração"
        verbose_name_plural = "Logs de Alteração"
        ordering = ["-data_hora"]

    def __str__(self):
        return f"{self.parcela} | {self.status_anterior} -> {self.status_novo}"


class BonusMensalCoordenador(models.Model):
    coordenador = models.ForeignKey(
        Coordenador,
        on_delete=models.CASCADE,
        related_name="bonus_mensais",
    )
    ano = models.PositiveIntegerField()
    mes = models.PositiveIntegerField()
    total_vendas_mes = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    percentual_bonus = models.DecimalField(max_digits=7, decimal_places=4, default=0)
    valor_bonus = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Bônus Mensal do Coordenador"
        verbose_name_plural = "Bônus Mensal do Coordenador"
        ordering = ["-ano", "-mes", "coordenador__nome"]
        unique_together = [["coordenador", "ano", "mes"]]

    def __str__(self):
        return f"{self.coordenador.nome} - {self.mes:02d}/{self.ano}"
