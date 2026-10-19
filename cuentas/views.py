from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LoginView, LogoutView
from django.shortcuts import redirect, render

from .forms import LoginForm, RegistroForm


def registro(request):
    if request.user.is_authenticated:
        return redirect("catalogo:inicio")
    if request.method == "POST":
        form = RegistroForm(request.POST)
        if form.is_valid():
            usuario = form.save()
            login(request, usuario)
            messages.success(request, "Cuenta creada. Ya iniciaste sesión.")
            return redirect("catalogo:inicio")
    else:
        form = RegistroForm()
    return render(request, "cuentas/registro.html", {"form": form})


class InicioSesionView(LoginView):
    template_name = "cuentas/login.html"
    authentication_form = LoginForm
    redirect_authenticated_user = True


class CierreSesionView(LogoutView):
    next_page = "catalogo:inicio"


@login_required
def perfil(request):
    return render(request, "cuentas/perfil.html")
