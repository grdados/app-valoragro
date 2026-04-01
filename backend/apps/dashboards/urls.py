from django.urls import path
from .views import DashboardAdminView, DashboardCoordenadorView, DashboardVendedorView

urlpatterns = [
    path("dashboards/admin/", DashboardAdminView.as_view(), name="dashboard-admin"),
    path("dashboards/coordenador/", DashboardCoordenadorView.as_view(), name="dashboard-coordenador"),
    path("dashboards/vendedor/", DashboardVendedorView.as_view(), name="dashboard-vendedor"),
]
