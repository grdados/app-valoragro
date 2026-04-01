from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SupervisorViewSet, ClienteViewSet, CoordenadorViewSet, VendedorViewSet,
    TipoBemViewSet, COBANViewSet, ConsorcioViewSet, FaixaComissaoViewSet, AssembleiaViewSet,
)

router = DefaultRouter()
router.register("supervisores", SupervisorViewSet, basename="supervisores")
router.register("clientes", ClienteViewSet, basename="clientes")
router.register("coordenadores", CoordenadorViewSet, basename="coordenadores")
router.register("vendedores", VendedorViewSet, basename="vendedores")
router.register("tipos-bem", TipoBemViewSet, basename="tipos-bem")
router.register("cobans", COBANViewSet, basename="cobans")
router.register("consorcios", ConsorcioViewSet, basename="consorcios")
router.register("faixas-comissao", FaixaComissaoViewSet, basename="faixas-comissao")
router.register("assembleias", AssembleiaViewSet, basename="assembleias")

urlpatterns = [
    path("", include(router.urls)),
]
