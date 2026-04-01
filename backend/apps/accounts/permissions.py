from rest_framework.permissions import BasePermission


class IsDev(BasePermission):
    """Somente o Desenvolvedor (perfil=dev ou superuser)."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_dev()


class IsSupervisor(BasePermission):
    """Somente Supervisor."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_supervisor()


class IsSupervisorOrAbove(BasePermission):
    """Supervisor ou Desenvolvedor."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_dev() or request.user.is_supervisor()
        )


class IsAdmin(BasePermission):
    """Alias de IsDev para compatibilidade."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_dev()


class IsAdminOrCoordenador(BasePermission):
    """Dev, Supervisor ou Coordenador."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.perfil in (
            "dev", "supervisor", "coordenador"
        )


class IsAnyAuthenticated(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated
