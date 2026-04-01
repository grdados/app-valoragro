from django.urls import path
from .views import RelatorioComissoesView

urlpatterns = [
    path("relatorios/comissoes/", RelatorioComissoesView.as_view(), name="relatorio-comissoes"),
]
