from datetime import date, timedelta
from decimal import Decimal
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from apps.vendas.models import Venda
from apps.comissoes.models import ParcelaComissao


def get_periodo(request):
    data_inicio = request.query_params.get("data_inicio")
    data_fim = request.query_params.get("data_fim")
    if not data_inicio:
        data_inicio = (date.today().replace(day=1) - timedelta(days=180)).isoformat()
    if not data_fim:
        data_fim = date.today().isoformat()
    return data_inicio, data_fim


def build_status_map(parcelas_qs):
    por_status = parcelas_qs.values("status").annotate(total=Sum("valor"), qtd=Count("id"))
    return {
        item["status"]: {
            "total": float(item["total"] or 0),
            "qtd": item["qtd"],
        }
        for item in por_status
    }


def apply_scope(vendas_qs, parcelas_qs, user):
    if user.is_dev():
        return vendas_qs, parcelas_qs
    if user.is_supervisor():
        if user.supervisor_ref:
            vendas_qs = vendas_qs.filter(vendedor__coordenador__supervisor=user.supervisor_ref)
            parcelas_qs = parcelas_qs.filter(venda__vendedor__coordenador__supervisor=user.supervisor_ref)
        return vendas_qs, parcelas_qs
    if user.is_coordenador():
        if user.coordenador_ref:
            vendas_qs = vendas_qs.filter(vendedor__coordenador=user.coordenador_ref)
            parcelas_qs = parcelas_qs.filter(venda__vendedor__coordenador=user.coordenador_ref)
        return vendas_qs, parcelas_qs
    if user.is_vendedor() and user.vendedor_ref:
        vendas_qs = vendas_qs.filter(vendedor=user.vendedor_ref)
        parcelas_qs = parcelas_qs.filter(venda__vendedor=user.vendedor_ref)
        return vendas_qs, parcelas_qs
    return vendas_qs.none(), parcelas_qs.none()


class DashboardAdminView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data_inicio, data_fim = get_periodo(request)

        vendas_qs = Venda.objects.filter(
            data_venda__gte=data_inicio, data_venda__lte=data_fim
        )
        parcelas_qs = ParcelaComissao.objects.filter(
            venda__data_venda__gte=data_inicio, venda__data_venda__lte=data_fim
        )

        vendas_qs, parcelas_qs = apply_scope(vendas_qs, parcelas_qs, request.user)

        total_vendido = vendas_qs.aggregate(total=Sum("valor_bem"))["total"] or Decimal("0")
        total_comissoes = parcelas_qs.aggregate(total=Sum("valor"))["total"] or Decimal("0")

        contemplados_qs = vendas_qs.filter(status="contemplado")
        total_contemplados = contemplados_qs.aggregate(total=Sum("valor_bem"))["total"] or Decimal("0")
        qtd_contemplados = contemplados_qs.count()

        ranking_vendedores = list(
            vendas_qs.values("vendedor__id", "vendedor__nome")
            .annotate(total_vendas=Sum("valor_bem"), qtd_vendas=Count("id"))
            .order_by("-total_vendas")[:10]
        )

        ranking_coordenadores = list(
            vendas_qs.values("vendedor__coordenador__id", "vendedor__coordenador__nome")
            .annotate(total_vendas=Sum("valor_bem"), qtd_vendas=Count("id"))
            .order_by("-total_vendas")[:10]
        )

        vendas_por_coban = list(
            vendas_qs.values("coban__sigla")
            .annotate(total=Sum("valor_bem"), qtd=Count("id"))
            .order_by("-total")
        )

        vendas_por_tipo = list(
            vendas_qs.values("tipo_bem__nome")
            .annotate(total=Sum("valor_bem"), qtd=Count("id"))
            .order_by("-total")
        )

        vendas_por_mes_raw = list(
            vendas_qs.annotate(mes=TruncMonth("data_venda"))
            .values("mes")
            .annotate(total=Sum("valor_bem"), qtd=Count("id"))
            .order_by("mes")
        )

        return Response({
            "total_vendido": float(total_vendido),
            "total_comissoes": float(total_comissoes),
            "comissoes_por_status": build_status_map(parcelas_qs),
            "ranking_vendedores": ranking_vendedores,
            "ranking_coordenadores": ranking_coordenadores,
            "vendas_por_coban": vendas_por_coban,
            "vendas_por_tipo": vendas_por_tipo,
            "total_contemplados": float(total_contemplados),
            "qtd_contemplados": qtd_contemplados,
            "vendas_por_mes": [
                {
                    "mes": m["mes"].isoformat() if m["mes"] else None,
                    "total": float(m["total"] or 0),
                    "qtd": m["qtd"],
                }
                for m in vendas_por_mes_raw
            ],
        })


class DashboardCoordenadorView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return DashboardAdminView().get(request)


class DashboardVendedorView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return DashboardAdminView().get(request)
