import json

from django.contrib.auth import get_user_model, login, logout, update_session_auth_hash
from django.contrib.auth.forms import AuthenticationForm, PasswordChangeForm, PasswordResetForm, SetPasswordForm
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

from catalogo.models import ConfiguracionSitio
from .forms import RegistroForm


def usuario_data(user):
    if not user.is_authenticated:
        return None
    return {"username": user.username, "first_name": user.first_name, "email": user.email,
            "is_staff": user.is_staff, "date_joined": user.date_joined}


def leer_json(request):
    try:
        data = json.loads(request.body)
        if not isinstance(data, dict) or any(not isinstance(v, str) for v in data.values()):
            raise ValueError
        return data
    except (ValueError, UnicodeDecodeError):
        return None


@require_GET
@never_cache
@ensure_csrf_cookie
def sesion(request):
    return JsonResponse({"user": usuario_data(request.user), "csrfToken": get_token(request)})


@require_POST
@never_cache
def registro(request):
    if not ConfiguracionSitio.obtener().registro_habilitado:
        return JsonResponse({"error": "El registro está deshabilitado."}, status=403)
    if request.user.is_authenticated:
        return JsonResponse({"error": "Ya hay una sesión iniciada."}, status=409)
    data = leer_json(request)
    if data is None:
        return JsonResponse({"error": "Se esperaba un objeto JSON de textos."}, status=400)
    form = RegistroForm(data)
    if not form.is_valid():
        return JsonResponse({"errors": form.errors.get_json_data()}, status=400)
    user = form.save()
    login(request, user)
    return JsonResponse({"user": usuario_data(user), "csrfToken": get_token(request)}, status=201)


@require_POST
@never_cache
def entrar(request):
    data = leer_json(request)
    if data is None:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    form = AuthenticationForm(request, data=data)
    if not form.is_valid():
        return JsonResponse({"errors": form.errors.get_json_data()}, status=400)
    login(request, form.get_user())
    return JsonResponse({"user": usuario_data(request.user), "csrfToken": get_token(request)})


@require_POST
@never_cache
def salir(request):
    logout(request)
    return JsonResponse({"user": None, "csrfToken": get_token(request)})


@require_POST
@never_cache
def perfil(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Inicia sesión."}, status=401)
    data = leer_json(request)
    if data is None:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    # Sólo campos permitidos: el cliente nunca puede asignarse permisos.
    from django import forms

    class PerfilForm(forms.ModelForm):
        first_name = forms.CharField(max_length=150)
        email = forms.EmailField()

        class Meta:
            model = get_user_model()
            fields = ("first_name", "email")

    form = PerfilForm(data, instance=request.user)
    if not form.is_valid():
        return JsonResponse({"errors": form.errors.get_json_data()}, status=400)
    user = form.save()
    return JsonResponse({"user": usuario_data(user)})


@require_POST
@never_cache
def cambiar_contrasena(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Inicia sesión."}, status=401)
    data = leer_json(request)
    if data is None:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    form = PasswordChangeForm(request.user, data)
    if not form.is_valid():
        return JsonResponse({"errors": form.errors.get_json_data()}, status=400)
    user = form.save()
    update_session_auth_hash(request, user)
    return JsonResponse({"csrfToken": get_token(request)})


@require_POST
@never_cache
def recuperar_contrasena(request):
    data = leer_json(request)
    if data is None:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    form = PasswordResetForm(data)
    if not form.is_valid():
        return JsonResponse({"errors": form.errors.get_json_data()}, status=400)
    form.save(request=request, use_https=request.is_secure(),
              email_template_name="cuentas/recuperar_email.txt",
              subject_template_name="cuentas/recuperar_asunto.txt")
    # La misma respuesta para correos registrados y desconocidos.
    return JsonResponse({"ok": True})


def usuario_del_enlace(uidb64, token):
    try:
        user = get_user_model().objects.get(pk=force_str(urlsafe_base64_decode(uidb64)))
    except (ValueError, TypeError, OverflowError, UnicodeDecodeError, get_user_model().DoesNotExist):
        return None
    return user if user.is_active and default_token_generator.check_token(user, token) else None


@require_http_methods(["GET", "POST"])
@never_cache
def restablecer_contrasena(request, uidb64, token):
    user = usuario_del_enlace(uidb64, token)
    if user is None:
        return JsonResponse({"error": "El enlace ya no es válido."}, status=400)
    if request.method == "GET":
        return JsonResponse({"valid": True})
    data = leer_json(request)
    if data is None:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    form = SetPasswordForm(user, data)
    if not form.is_valid():
        return JsonResponse({"errors": form.errors.get_json_data()}, status=400)
    form.save()
    return JsonResponse({"ok": True})
