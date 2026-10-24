from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("api/v1/auth/", include("cuentas.api_urls")),
    path("api/v1/", include("catalogo.api_urls")),
    path("admin/", admin.site.urls),
    path("cuentas/", include("cuentas.urls")),
    path("", include("catalogo.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
