from django.http import HttpResponse
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.accounts.permissions import IsAdminOrCoordenador
from apps.vendas.models import Venda
from .models import ParcelaComissao
from .serializers import ParcelaComissaoSerializer, AlterarStatusSerializer, GerarComissoesSerializer
from .services import gerar_parcelas, alterar_status as service_alterar_status


def scope_parcelas(qs, user):
    if user.is_dev():
        return qs
    if user.is_supervisor():
        # Supervisor visualiza todas as comissões.
        return qs
    if user.is_coordenador():
        if user.coordenador_ref:
            # Coordenador visualiza somente comissões dos vendedores vinculados.
            return qs.filter(
                venda__vendedor__coordenador=user.coordenador_ref,
                perfil_comissao="vendedor",
            )
        return qs
    if user.is_vendedor():
        if user.vendedor_ref:
            # Vendedor visualiza somente as próprias comissões.
            return qs.filter(venda__vendedor=user.vendedor_ref, perfil_comissao="vendedor")
        return qs.none()
    return qs.none()


class ParcelaComissaoViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ParcelaComissaoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = ParcelaComissao.objects.select_related(
            "venda", "venda__cliente", "venda__vendedor", "venda__vendedor__coordenador"
        ).prefetch_related("logs", "logs__usuario")

        qs = scope_parcelas(qs, user)

        vendedor = self.request.query_params.get("vendedor")
        coordenador = self.request.query_params.get("coordenador")
        status_param = self.request.query_params.get("status")
        data_inicio = self.request.query_params.get("data_inicio")
        data_fim = self.request.query_params.get("data_fim")
        venda = self.request.query_params.get("venda")
        cliente = self.request.query_params.get("cliente")
        perfil_comissao = self.request.query_params.get("perfil_comissao")

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
        if venda:
            qs = qs.filter(venda_id=venda)
        if cliente:
            qs = qs.filter(venda__cliente_id=cliente)
        if perfil_comissao:
            qs = qs.filter(perfil_comissao=perfil_comissao)

        return qs

    @action(detail=True, methods=["patch"], url_path="status", permission_classes=[permissions.IsAuthenticated, IsAdminOrCoordenador])
    def alterar_status(self, request, pk=None):
        parcela = self.get_object()
        serializer = AlterarStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        parcela = service_alterar_status(
            parcela,
            serializer.validated_data["status"],
            request.user,
            serializer.validated_data.get("observacao", ""),
            serializer.validated_data.get("status_contrato_banco"),
        )
        return Response(ParcelaComissaoSerializer(parcela).data)

    @action(detail=True, methods=["get"], url_path="recibo", permission_classes=[permissions.IsAuthenticated])
    def recibo(self, request, pk=None):
        parcela = self.get_object()
        if parcela.status != "pago":
            return Response({"detail": "Recibo disponível apenas para parcelas pagas."}, status=400)
        from apps.relatorios.generators import gerar_recibo_pdf
        try:
            from apps.empresa.models import DadosEmpresa
            empresa = DadosEmpresa.objects.first()
        except Exception:
            empresa = None
        buffer = gerar_recibo_pdf(parcela, empresa)
        response = HttpResponse(buffer, content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="recibo-{parcela.venda.numero_contrato}-p{parcela.numero_parcela}.pdf"'
        return response

    @action(detail=False, methods=["post"], url_path="gerar", permission_classes=[permissions.IsAuthenticated])
    def gerar(self, request):
        serializer = GerarComissoesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            venda = Venda.objects.get(id=serializer.validated_data["venda_id"])
        except Venda.DoesNotExist:
            return Response({"detail": "Venda não encontrada."}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if not (user.is_dev() or user.is_supervisor()):
            if user.is_coordenador() and user.coordenador_ref and venda.vendedor.coordenador != user.coordenador_ref:
                return Response({"detail": "Sem permissão."}, status=status.HTTP_403_FORBIDDEN)
            if user.is_vendedor() and venda.vendedor != user.vendedor_ref:
                return Response({"detail": "Sem permissão."}, status=status.HTTP_403_FORBIDDEN)

        try:
            parcelas = gerar_parcelas(venda, usuario=request.user)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ParcelaComissaoSerializer(parcelas, many=True).data, status=status.HTTP_201_CREATED)
