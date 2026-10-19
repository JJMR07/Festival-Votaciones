from django.contrib import admin
from django.urls import include, path

admin.site.site_header = "Administración — Festival de la Leyenda Vallenata"
admin.site.site_title = "Admin votaciones"
admin.site.index_title = "Gestión de ediciones, categorías, votaciones y opciones"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("cuentas/", include("cuentas.urls")),
    path("", include("catalogo.urls")),
]
