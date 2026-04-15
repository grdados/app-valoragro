from django.contrib import admin
from .models import (
    Coordenador,
    Vendedor,
    TipoBem,
    COBAN,
    Consorcio,
    FaixaComissao,
    FaixaComissaoVendedor,
    FaixaComissaoCoordenador,
    Assembleia,
)


@admin.register(Coordenador)
class CoordenadorAdmin(admin.ModelAdmin):
    list_display = ("nome", "cpf", "email", "ativo")
    list_filter = ("ativo",)
    search_fields = ("nome", "cpf", "email")


@admin.register(Vendedor)
class VendedorAdmin(admin.ModelAdmin):
    list_display = ("nome", "cpf", "email", "coordenador", "ativo")
    list_filter = ("ativo", "coordenador")
    search_fields = ("nome", "cpf", "email")


@admin.register(TipoBem)
class TipoBemAdmin(admin.ModelAdmin):
    list_display = ("nome", "descricao", "ativo")


@admin.register(COBAN)
class COBANAdmin(admin.ModelAdmin):
    list_display = ("sigla", "descricao", "ativo")


@admin.register(Consorcio)
class ConsorcioAdmin(admin.ModelAdmin):
    list_display = ("nome", "coban", "tipo_bem", "vigencia_inicio", "vigencia_fim", "ativo")
    list_filter = ("coban", "tipo_bem", "ativo")
    search_fields = ("nome",)


@admin.register(FaixaComissao)
class FaixaComissaoAdmin(admin.ModelAdmin):
    list_display = ("consorcio", "valor_min", "valor_max", "ativo")


@admin.register(FaixaComissaoVendedor)
class FaixaComissaoVendedorAdmin(admin.ModelAdmin):
    list_display = ("valor_min", "valor_max", "percentual_total", "qtd_parcelas", "ativo")


@admin.register(FaixaComissaoCoordenador)
class FaixaComissaoCoordenadorAdmin(admin.ModelAdmin):
    list_display = ("valor_min", "valor_max", "percentual_total", "qtd_parcelas", "ativo")


@admin.register(Assembleia)
class AssembleiaAdmin(admin.ModelAdmin):
    list_display = ("consorcio", "data_assembleia", "descricao")
    list_filter = ("consorcio",)
