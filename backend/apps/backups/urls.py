from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BackupViewSet

router = DefaultRouter()
router.register("backups", BackupViewSet, basename="backups")

urlpatterns = [
    path("", include(router.urls)),
]
