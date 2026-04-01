from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenRefreshView
from apps.accounts.views import CustomTokenObtainPairView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/", include("apps.accounts.urls")),
    path("api/", include("apps.cadastros.urls")),
    path("api/", include("apps.vendas.urls")),
    path("api/", include("apps.comissoes.urls")),
    path("api/", include("apps.dashboards.urls")),
    path("api/", include("apps.relatorios.urls")),
    path("api/", include("apps.empresa.urls")),
    path("api/dev/", include("apps.licencas.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
