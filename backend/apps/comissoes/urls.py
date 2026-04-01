from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ParcelaComissaoViewSet

router = DefaultRouter()
router.register("comissoes", ParcelaComissaoViewSet, basename="comissoes")

urlpatterns = [
    path("", include(router.urls)),
]
