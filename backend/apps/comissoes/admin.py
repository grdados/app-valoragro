from django.contrib import admin
from .models import ParcelaComissao, LogAlteracao, BonusMensalCoordenador


@admin.register(ParcelaComissao)
class ParcelaComissaoAdmin(admin.ModelAdmin):
    list_display = ("venda", "numero_parcela", "data_vencimento", "valor", "status")
    list_filter = ("status",)
    search_fields = ("venda__numero_contrato",)
    date_hierarchy = "data_vencimento"


@admin.register(LogAlteracao)
class LogAlteracaoAdmin(admin.ModelAdmin):
    list_display = ("parcela", "status_anterior", "status_novo", "usuario", "data_hora")
    list_filter = ("status_novo",)
    readonly_fields = ("parcela", "usuario", "status_anterior", "status_novo", "data_hora")


@admin.register(BonusMensalCoordenador)
class BonusMensalCoordenadorAdmin(admin.ModelAdmin):
    list_display = ("coordenador", "mes", "ano", "total_vendas_mes", "percentual_bonus", "valor_bonus")
    list_filter = ("ano", "mes")
