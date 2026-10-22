from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("api/v1/auth/", include("cuentas.api_urls")),
    path("api/v1/", include("catalogo.api_urls")),
    path("admin/", admin.site.urls),
    path("cuentas/", include("cuentas.urls")),
    path("", include("catalogo.urls")),
]
