from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LicencaViewSet, PagamentoLicencaViewSet

router = DefaultRouter()
router.register("licencas", LicencaViewSet, basename="licencas")
router.register("licencas-pagamentos", PagamentoLicencaViewSet, basename="licencas-pagamentos")

urlpatterns = [
    path("", include(router.urls)),
]
