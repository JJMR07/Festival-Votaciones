"""Django sirve la plantilla de entrada y Vite los recursos compilados."""
import json
from pathlib import Path

from django.conf import settings
from django.http import Http404
from django.shortcuts import render
from django.templatetags.static import static
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.cache import never_cache

from catalogo.models import ConfiguracionSitio
from catalogo.selectors import votaciones_publicas
from catalogo.serializers import configuracion_data


@ensure_csrf_cookie
@never_cache
def index(request, pk=None, **kwargs):
    if pk is not None and not votaciones_publicas().filter(pk=pk).exists():
        raise Http404
    manifest = Path(settings.BASE_DIR) / "static/frontend/.vite/manifest.json"
    entry = {}
    if manifest.exists():
        entry = json.loads(manifest.read_text(encoding="utf-8")).get("src/main.jsx", {})
    config = configuracion_data(ConfiguracionSitio.obtener())
    return render(request, "react.html", {
        "sitio": config, "bootstrap": {"config": config},
        "script": static("frontend/" + entry["file"]) if entry else None,
        "css": [static("frontend/" + path) for path in entry.get("css", [])],
    })
