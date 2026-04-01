from django.contrib import admin
from .models import Venda


@admin.register(Venda)
class VendaAdmin(admin.ModelAdmin):
    list_display = ("numero_contrato", "data_venda", "vendedor", "coban", "tipo_bem", "valor_bem", "valor_total_comissao", "status")
    list_filter = ("status", "coban", "tipo_bem", "data_venda")
    search_fields = ("numero_contrato", "vendedor__nome")
    date_hierarchy = "data_venda"
