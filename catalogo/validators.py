from django.core.exceptions import ValidationError
from django.core.validators import URLValidator
from pathlib import Path
from uuid import uuid4


def ruta_imagen(instance, filename):
    return f"catalogo/{uuid4().hex}{Path(filename).suffix.lower()}"


def validar_imagen_archivo(archivo):
    """Imágenes raster de hasta 5 MB y 4096 píxeles por lado."""
    from PIL import Image, UnidentifiedImageError

    if archivo.size > 5 * 1024 * 1024:
        raise ValidationError("La imagen debe pesar como máximo 5 MB.")
    try:
        archivo.seek(0)
        with Image.open(archivo) as image:
            if image.format not in {"JPEG", "PNG", "WEBP"}:
                raise ValidationError("Selecciona una imagen JPG, PNG o WebP.")
            if max(image.size) > 4096:
                raise ValidationError("La imagen no puede superar 4096 píxeles por lado.")
            image.verify()
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as error:
        raise ValidationError("El archivo no es una imagen válida.") from error
    finally:
        archivo.seek(0)


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
