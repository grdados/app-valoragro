from rest_framework import viewsets, permissions
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.accounts.permissions import IsAdmin, IsSupervisorOrAbove, IsAdminOrCoordenador
from .models import Supervisor, Cliente, Coordenador, Vendedor, TipoBem, COBAN, Consorcio, FaixaComissao, Assembleia
from .serializers import (
    SupervisorSerializer, ClienteSerializer, CoordenadorSerializer, VendedorSerializer,
    PublicVendedorSerializer, TipoBemSerializer, COBANSerializer, ConsorcioSerializer,
    FaixaComissaoSerializer, AssembleiaSerializer,
)


class SupervisorViewSet(viewsets.ModelViewSet):
    queryset = Supervisor.objects.all()
    serializer_class = SupervisorSerializer
    permission_classes = [permissions.IsAuthenticated, IsSupervisorOrAbove]

    def get_queryset(self):
        qs = super().get_queryset()
        ativo = self.request.query_params.get("ativo")
        if ativo is not None:
            qs = qs.filter(ativo=ativo.lower() == "true")
        return qs


class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        ativo = self.request.query_params.get("ativo")
        search = self.request.query_params.get("search")
        if ativo is not None:
            qs = qs.filter(ativo=ativo.lower() == "true")
        if search:
            qs = qs.filter(nome__icontains=search) | qs.filter(cpf__icontains=search)
        return qs

    def get_permissions(self):
        if self.action in ("destroy",):
            return [permissions.IsAuthenticated(), IsAdmin()]
        return [permissions.IsAuthenticated()]


class CoordenadorViewSet(viewsets.ModelViewSet):
    queryset = Coordenador.objects.select_related("supervisor")
    serializer_class = CoordenadorSerializer

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        ativo = self.request.query_params.get("ativo")
        if not user.is_dev():
            if user.is_supervisor():
                if user.supervisor_ref:
                    qs = qs.filter(supervisor=user.supervisor_ref)
                # supervisor with no ref sees all coordenadores
            elif user.is_coordenador():
                if user.coordenador_ref:
                    qs = qs.filter(id=user.coordenador_ref.id)
                # coordenador with no ref sees all (to pick self in forms)
            else:
                qs = qs.none()
        if ativo is not None:
            qs = qs.filter(ativo=ativo.lower() == "true")
        return qs

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated(), IsSupervisorOrAbove()]
        return [permissions.IsAuthenticated()]


class VendedorViewSet(viewsets.ModelViewSet):
    serializer_class = VendedorSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Vendedor.objects.select_related("coordenador")
        if user.is_dev():
            pass
        elif user.is_supervisor():
            if user.supervisor_ref:
                qs = qs.filter(coordenador__supervisor=user.supervisor_ref)
            # supervisor with no ref sees all vendedores
        elif user.is_coordenador() and user.coordenador_ref:
            qs = qs.filter(coordenador=user.coordenador_ref)
        else:
            if user.vendedor_ref:
                qs = qs.filter(id=user.vendedor_ref.id)
            else:
                qs = qs.none()
        ativo = self.request.query_params.get("ativo")
        if ativo is not None:
            qs = qs.filter(ativo=ativo.lower() == "true")
        return qs

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated(), IsAdminOrCoordenador()]
        return [permissions.IsAuthenticated()]


class TipoBemViewSet(viewsets.ModelViewSet):
    queryset = TipoBem.objects.all()
    serializer_class = TipoBemSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated(), IsSupervisorOrAbove()]
        return [permissions.IsAuthenticated()]


class COBANViewSet(viewsets.ModelViewSet):
    queryset = COBAN.objects.all()
    serializer_class = COBANSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated(), IsSupervisorOrAbove()]
        return [permissions.IsAuthenticated()]


class ConsorcioViewSet(viewsets.ModelViewSet):
    queryset = Consorcio.objects.select_related("coban", "tipo_bem").prefetch_related("faixas", "assembleias")
    serializer_class = ConsorcioSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated(), IsSupervisorOrAbove()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        coban = self.request.query_params.get("coban")
        tipo_bem = self.request.query_params.get("tipo_bem")
        ativo = self.request.query_params.get("ativo")
        if coban:
            qs = qs.filter(coban__sigla=coban)
        if tipo_bem:
            qs = qs.filter(tipo_bem__nome=tipo_bem)
        if ativo is not None:
            qs = qs.filter(ativo=ativo.lower() == "true")
        return qs


class FaixaComissaoViewSet(viewsets.ModelViewSet):
    queryset = FaixaComissao.objects.select_related("consorcio")
    serializer_class = FaixaComissaoSerializer
    permission_classes = [permissions.IsAuthenticated, IsSupervisorOrAbove]


class AssembleiaViewSet(viewsets.ModelViewSet):
    queryset = Assembleia.objects.select_related("consorcio")
    serializer_class = AssembleiaSerializer
    permission_classes = [permissions.IsAuthenticated, IsSupervisorOrAbove]


class PublicVendedoresListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        queryset = Vendedor.objects.filter(ativo=True).order_by("nome")
        serializer = PublicVendedorSerializer(queryset, many=True)
        return Response(serializer.data)
