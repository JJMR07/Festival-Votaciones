from django.core.exceptions import ValidationError
from django.core.validators import URLValidator


def validar_imagen(valor):
    """Se admiten archivos estáticos locales y URL https, nunca javascript/data."""
    if valor.startswith("/static/") and ".." not in valor and not any(c in valor for c in "?#\\"):
        return
    URLValidator(schemes=["https"])(valor)


def validar_textos(valor):
    from .defaults import textos_iniciales

    if not isinstance(valor, dict):
        raise ValidationError("Usa un objeto JSON con claves y textos.")
    desconocidas = set(valor) - set(textos_iniciales())
    if desconocidas:
        raise ValidationError("Claves desconocidas: " + ", ".join(sorted(desconocidas)))
    if any(not isinstance(v, str) or not v.strip() or len(v) > 2000 for v in valor.values()):
        raise ValidationError("Cada texto debe tener entre 1 y 2000 caracteres.")
