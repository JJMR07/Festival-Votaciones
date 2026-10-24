from django.urls import path

from config.frontend import index
from .views import cerrar_sesion

app_name = "cuentas"

urlpatterns = [
    path("registro/", index, name="registro"),
    path("login/", index, name="login"),
    path("logout/", cerrar_sesion, name="logout"),
    path("perfil/", index, name="perfil"),
    path("contrasena/", index, name="contrasena"),
    path("recuperar/", index, name="recuperar"),
    path("restablecer/<str:uidb64>/<str:token>/", index, name="restablecer"),
]
