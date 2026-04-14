from importlib import import_module
from django.contrib import admin
from django.urls import path, include, re_path
from django.urls.resolvers import LocalePrefixPattern
from django.core.exceptions import ImproperlyConfigured
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenRefreshView
from apps.accounts.views import CustomTokenObtainPairView
import django.urls as django_urls
import django.urls.conf as django_urls_conf


def _admin_urlpatterns():
    """
    Em alguns ambientes locais (Python 3.13 + versões específicas do Django),
    a resolução de admin.site.urls quebra o include interno do Django.
    Não deixamos isso derrubar toda a API.
    """
    try:
        return [path("admin/", admin.site.urls)]
    except Exception:
        return []


def _safe_include(arg, namespace=None):
    app_name = None
    if isinstance(arg, tuple):
        try:
            urlconf_module, app_name = arg
        except ValueError:
            if namespace:
                raise ImproperlyConfigured(
                    "Cannot override the namespace for a dynamic module that provides a namespace."
                )
            raise ImproperlyConfigured(
                f"Passing a {len(arg)}-tuple to include() is not supported."
            )
    else:
        urlconf_module = arg

    if isinstance(urlconf_module, str):
        urlconf_module = import_module(urlconf_module)
        patterns = getattr(urlconf_module, "urlpatterns", urlconf_module)
        app_name = getattr(urlconf_module, "app_name", app_name)
    else:
        patterns = getattr(urlconf_module, "urlpatterns", urlconf_module)

    if namespace and not app_name:
        raise ImproperlyConfigured(
            "Specifying a namespace in include() without providing an app_name is not supported."
        )

    namespace = namespace or app_name
    if isinstance(patterns, (list, tuple)):
        for url_pattern in patterns:
            pattern = getattr(url_pattern, "pattern", None)
            if isinstance(pattern, LocalePrefixPattern):
                raise ImproperlyConfigured(
                    "Using i18n_patterns in an included URLconf is not allowed."
                )

    return (urlconf_module, app_name, namespace)


# Compatibilidade local para include() em ambientes onde a função padrão está quebrada.
django_urls_conf.include = _safe_include
django_urls.include = _safe_include
include = _safe_include

urlpatterns = [
    path("api/auth/login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/", include("apps.accounts.urls")),
    path("api/", include("apps.cadastros.urls")),
    path("api/", include("apps.vendas.urls")),
    path("api/", include("apps.comissoes.urls")),
    path("api/", include("apps.dashboards.urls")),
    path("api/", include("apps.relatorios.urls")),
    path("api/", include("apps.empresa.urls")),
    path("api/", include("apps.backups.urls")),
    path("api/dev/", include("apps.licencas.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]

urlpatterns = _admin_urlpatterns() + urlpatterns

# Em producao (DEBUG=False) o helper static() nao expoe media.
# Mantemos um fallback simples para servir uploads de vendedores.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    urlpatterns += [
        re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
    ]
