from rest_framework import viewsets, permissions
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User
from .serializers import CustomTokenObtainPairSerializer, UserSerializer
from .permissions import IsDev, IsSupervisorOrAbove, IsAdminOrCoordenador


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("username")
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action == "destroy":
            return [permissions.IsAuthenticated(), IsDev()]
        if self.action == "create":
            return [permissions.IsAuthenticated(), IsAdminOrCoordenador()]
        return [permissions.IsAuthenticated(), IsSupervisorOrAbove()]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.is_dev():
            return qs
        if user.is_supervisor():
            return qs.filter(perfil__in=("supervisor", "coordenador", "vendedor"))
        if user.is_coordenador():
            return qs.filter(perfil="vendedor")
        return qs.filter(id=user.id)

    def update(self, request, *args, **kwargs):
        target = self.get_object()
        if target.is_dev() and not request.user.is_dev():
            from rest_framework.response import Response
            return Response({"detail": "Sem permissão para alterar o Desenvolvedor."}, status=403)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        target = self.get_object()
        if target.is_dev() and not request.user.is_dev():
            from rest_framework.response import Response
            return Response({"detail": "Sem permissão para remover o Desenvolvedor."}, status=403)
        return super().destroy(request, *args, **kwargs)
