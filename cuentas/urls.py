from django.urls import path

from .views import CierreSesionView, InicioSesionView, perfil, registro

app_name = "cuentas"

urlpatterns = [
    path("registro/", registro, name="registro"),
    path("login/", InicioSesionView.as_view(), name="login"),
    path("logout/", CierreSesionView.as_view(), name="logout"),
    path("perfil/", perfil, name="perfil"),
]
