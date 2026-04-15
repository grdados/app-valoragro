from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.accounts.permissions import IsAdminOrCoordenador
from apps.comissoes.models import ParcelaComissao
from .models import Venda
from .serializers import VendaSerializer, VendaPreviewSerializer, AlterarStatusVendaSerializer


def scope_vendas(qs, user):
    if user.is_dev():
        return qs
    if user.is_supervisor():
        if user.supervisor_ref:
            return qs.filter(vendedor__coordenador__supervisor=user.supervisor_ref)
        return qs
    if user.is_coordenador():
        if user.coordenador_ref:
            return qs.filter(vendedor__coordenador=user.coordenador_ref)
        return qs
    if user.is_vendedor():
        if user.vendedor_ref:
            return qs.filter(vendedor=user.vendedor_ref)
        return qs.none()
    return qs.none()


class VendaViewSet(viewsets.ModelViewSet):
    serializer_class = VendaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Venda.objects.select_related(
            "cliente", "vendedor", "vendedor__coordenador", "coban", "tipo_bem", "consorcio"
        )
        qs = scope_vendas(qs, user)

        vendedor = self.request.query_params.get("vendedor")
        coordenador = self.request.query_params.get("coordenador")
        coban = self.request.query_params.get("coban")
        tipo_bem = self.request.query_params.get("tipo_bem")
        data_inicio = self.request.query_params.get("data_inicio")
        data_fim = self.request.query_params.get("data_fim")
        status_param = self.request.query_params.get("status")
        cliente = self.request.query_params.get("cliente")

        if vendedor:
            qs = qs.filter(vendedor_id=vendedor)
        if coordenador:
            qs = qs.filter(vendedor__coordenador_id=coordenador)
        if coban:
            qs = qs.filter(coban__sigla=coban)
        if tipo_bem:
            qs = qs.filter(tipo_bem__nome=tipo_bem)
        if data_inicio:
            qs = qs.filter(data_venda__gte=data_inicio)
        if data_fim:
            qs = qs.filter(data_venda__lte=data_fim)
        if status_param:
            qs = qs.filter(status=status_param)
        if cliente:
            qs = qs.filter(cliente_id=cliente)

        return qs

    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)

    def get_permissions(self):
        if self.action in ("destroy", "update", "partial_update", "alterar_status"):
            return [permissions.IsAuthenticated(), IsAdminOrCoordenador()]
        return [permissions.IsAuthenticated()]

    def destroy(self, request, *args, **kwargs):
        venda = self.get_object()
        possui_comissao_paga = ParcelaComissao.objects.filter(
            venda=venda,
            status="pago",
        ).exists()
        if possui_comissao_paga:
            return Response(
                {
                    "detail": "Não é possível remover a venda: existem comissões pagas. "
                    "Faça o estorno dos pagamentos antes de excluir."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["patch"], url_path="status")
    def alterar_status(self, request, pk=None):
        venda = self.get_object()
        serializer = AlterarStatusVendaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        venda.status = serializer.validated_data["status"]
        venda.save(update_fields=["status", "atualizado_em"])
        return Response(VendaSerializer(venda).data)

    @action(detail=False, methods=["post"], url_path="preview")
    def preview(self, request):
        serializer = VendaPreviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        response_data = {
            "consorcios_disponiveis": data.get("_consorcios", []),
        }

        if "_parcelas" in data:
            response_data["parcelas"] = data["_parcelas"]
            response_data["valor_total_comissao"] = float(data["_total"])
            response_data["primeiro_vencimento"] = data["_primeiro_vencimento"].isoformat()
            response_data["perfil_preview"] = "vendedor"

        return Response(response_data)
