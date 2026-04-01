from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework import permissions
from apps.comissoes.models import ParcelaComissao
from .generators import gerar_excel_comissoes, gerar_pdf_comissoes


def build_queryset(request):
    qs = ParcelaComissao.objects.select_related(
        "venda", "venda__cliente", "venda__vendedor", "venda__vendedor__coordenador"
    )
    user = request.user
    if user.is_dev():
        pass
    elif user.is_supervisor():
        if user.supervisor_ref:
            qs = qs.filter(venda__vendedor__coordenador__supervisor=user.supervisor_ref)
        # supervisor with no ref sees all
    elif user.is_coordenador():
        if user.coordenador_ref:
            qs = qs.filter(venda__vendedor__coordenador=user.coordenador_ref)
        # coordenador with no ref sees all
    elif user.is_vendedor() and user.vendedor_ref:
        qs = qs.filter(venda__vendedor=user.vendedor_ref)
    else:
        qs = qs.none()

    vendedor = request.query_params.get("vendedor")
    coordenador = request.query_params.get("coordenador")
    status_param = request.query_params.get("status")
    data_inicio = request.query_params.get("data_inicio")
    data_fim = request.query_params.get("data_fim")
    cliente = request.query_params.get("cliente")
    cpf_cliente = request.query_params.get("cpf_cliente")
    status_venda = request.query_params.get("status_venda")
    contrato = request.query_params.get("contrato")

    if vendedor:
        qs = qs.filter(venda__vendedor_id=vendedor)
    if coordenador:
        qs = qs.filter(venda__vendedor__coordenador_id=coordenador)
    if status_param:
        qs = qs.filter(status=status_param)
    if data_inicio:
        qs = qs.filter(data_vencimento__gte=data_inicio)
    if data_fim:
        qs = qs.filter(data_vencimento__lte=data_fim)
    if cliente:
        qs = qs.filter(venda__cliente_id=cliente)
    if cpf_cliente:
        qs = qs.filter(venda__cliente__cpf__icontains=cpf_cliente)
    if status_venda:
        qs = qs.filter(venda__status=status_venda)
    if contrato:
        qs = qs.filter(venda__numero_contrato__icontains=contrato)

    return qs


class RelatorioComissoesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        formato = request.query_params.get("formato", "excel")
        tipo = request.query_params.get("tipo", "")

        titulos = {
            "aberto": "Comissões em Aberto",
            "atraso": "Comissões em Atraso",
            "pagas": "Comissões Pagas",
            "extrato_vendedor": "Extrato por Vendedor",
            "extrato_coordenador": "Extrato por Coordenador",
            "por_cliente": "Comissões por Cliente",
            "fechamento_contrato": "Fechamento de Comissões por Contrato",
            "contemplados": "Contratos Contemplados",
            "a_contemplar": "Contratos a Contemplar",
        }
        titulo = titulos.get(tipo, "Relatório de Comissões")

        status_map = {"aberto": "pendente", "atraso": "vencido", "pagas": "pago"}
        qs = build_queryset(request)
        if tipo in status_map:
            qs = qs.filter(status=status_map[tipo])
        if tipo == "contemplados":
            qs = qs.filter(venda__status="contemplado")
        if tipo == "a_contemplar":
            qs = qs.filter(venda__status="a_contemplar")

        qs = qs.order_by("venda__vendedor__coordenador__nome", "venda__vendedor__nome", "data_vencimento")

        if formato == "pdf":
            buffer = gerar_pdf_comissoes(qs, titulo=titulo)
            response = HttpResponse(buffer, content_type="application/pdf")
            response["Content-Disposition"] = f'attachment; filename="comissoes.pdf"'
            return response
        else:
            output = gerar_excel_comissoes(qs, titulo=titulo)
            response = HttpResponse(
                output,
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
            response["Content-Disposition"] = f'attachment; filename="comissoes.xlsx"'
            return response
