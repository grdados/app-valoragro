from django.db import models


class Licenca(models.Model):
    PLANO_CHOICES = [
        ("mensal", "Mensal"),
        ("trimestral", "Trimestral"),
        ("semestral", "Semestral"),
        ("anual", "Anual"),
    ]
    STATUS_CHOICES = [
        ("ativa", "Ativa"),
        ("suspensa", "Suspensa"),
        ("cancelada", "Cancelada"),
    ]
    nome_empresa = models.CharField(max_length=200)
    cnpj = models.CharField(max_length=18, blank=True)
    email_contato = models.EmailField()
    telefone = models.CharField(max_length=20, blank=True)
    plano = models.CharField(max_length=20, choices=PLANO_CHOICES, default="mensal")
    valor_mensalidade = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="ativa")
    data_inicio = models.DateField()
    data_expiracao = models.DateField()
    observacoes = models.TextField(blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Licença"
        verbose_name_plural = "Licenças"
        ordering = ["-criado_em"]

    def __str__(self):
        return f"{self.nome_empresa} — {self.get_status_display()}"


class PagamentoLicenca(models.Model):
    STATUS_CHOICES = [
        ("pago", "Pago"),
        ("pendente", "Pendente"),
        ("vencido", "Vencido"),
    ]
    licenca = models.ForeignKey(Licenca, on_delete=models.CASCADE, related_name="pagamentos")
    competencia = models.CharField(max_length=7, help_text="Ex: 2024-03")
    data_vencimento = models.DateField()
    data_pagamento = models.DateField(null=True, blank=True)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pendente")
    observacao = models.TextField(blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Pagamento de Licença"
        verbose_name_plural = "Pagamentos de Licença"
        ordering = ["-data_vencimento"]

    def __str__(self):
        return f"{self.licenca.nome_empresa} — {self.competencia}"
