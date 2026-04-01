from django.db import models
from apps.cadastros.models import Cliente, Vendedor, COBAN, TipoBem, Consorcio


class Venda(models.Model):
    STATUS_CHOICES = [
        ("a_contemplar", "A Contemplar"),
        ("contemplado", "Contemplado"),
        ("cancelada", "Cancelada"),
    ]
    data_venda = models.DateField()
    numero_contrato = models.CharField(max_length=50, unique=True)
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name="vendas", null=True, blank=True)
    vendedor = models.ForeignKey(Vendedor, on_delete=models.PROTECT, related_name="vendas")
    coban = models.ForeignKey(COBAN, on_delete=models.PROTECT, related_name="vendas")
    tipo_bem = models.ForeignKey(TipoBem, on_delete=models.PROTECT, related_name="vendas")
    valor_bem = models.DecimalField(max_digits=15, decimal_places=2)
    consorcio = models.ForeignKey(Consorcio, on_delete=models.PROTECT, related_name="vendas")
    valor_total_comissao = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="a_contemplar")
    criado_por = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="vendas_criadas"
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Venda"
        verbose_name_plural = "Vendas"
        ordering = ["-data_venda"]

    def __str__(self):
        return f"{self.numero_contrato} - {self.vendedor}"
