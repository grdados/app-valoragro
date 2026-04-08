from django.urls import path
from .views import DadosEmpresaView, PublicDadosEmpresaView

urlpatterns = [
    path("empresa/", DadosEmpresaView.as_view(), name="dados-empresa"),
    path("public/empresa/", PublicDadosEmpresaView.as_view(), name="public-dados-empresa"),
]
