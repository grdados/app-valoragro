from django.urls import path
from .views import DadosEmpresaView

urlpatterns = [
    path("empresa/", DadosEmpresaView.as_view(), name="dados-empresa"),
]
