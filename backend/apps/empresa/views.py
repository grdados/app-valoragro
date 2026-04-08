from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from apps.accounts.permissions import IsSupervisorOrAbove
from .models import DadosEmpresa
from .serializers import DadosEmpresaSerializer


class DadosEmpresaView(APIView):
    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH"):
            return [permissions.IsAuthenticated(), IsSupervisorOrAbove()]
        return [permissions.AllowAny()]

    def get(self, request):
        obj = DadosEmpresa.objects.first()
        if not obj:
            return Response({})
        return Response(DadosEmpresaSerializer(obj).data)

    def put(self, request):
        obj = DadosEmpresa.objects.first()
        if obj:
            serializer = DadosEmpresaSerializer(obj, data=request.data)
        else:
            serializer = DadosEmpresaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request):
        obj = DadosEmpresa.objects.first()
        if not obj:
            return Response({"detail": "Dados da empresa nao configurados."}, status=status.HTTP_404_NOT_FOUND)
        serializer = DadosEmpresaSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class PublicDadosEmpresaView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        obj = DadosEmpresa.objects.first()
        if not obj:
            return Response({})
        return Response(DadosEmpresaSerializer(obj).data)
