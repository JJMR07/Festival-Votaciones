"""Servidor exclusivo de Playwright: datos temporales, nunca PostgreSQL local."""
import os
import logging
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings"

from django.conf import settings


def main():
    with tempfile.TemporaryDirectory(prefix="festival-e2e-") as directory:
        settings.DATABASES = {"default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": str(Path(directory) / "browser-tests.sqlite3"),
        }}
        settings.DEBUG = True
        settings.ALLOWED_HOSTS = ["127.0.0.1", "localhost"]
        settings.MEDIA_ROOT = Path(directory) / "media"
        settings.EMAIL_FILE_PATH = os.getenv("E2E_EMAIL_PATH", str(Path(directory) / "correos"))
        import django
        django.setup()
        logging.getLogger('django.server').setLevel(logging.WARNING)
        from django.core.management import call_command
        from catalogo.models import Categoria, ConfiguracionSitio, Edicion, Opcion, Votacion

        from django.db import connections
        try:
            call_command("migrate", interactive=False, verbosity=0)
            from django.contrib.auth import get_user_model
            get_user_model().objects.create_superuser("admin_e2e", "admin-e2e@example.com", "Admin-Solo-Pruebas-2026!")
            ConfiguracionSitio.objects.update_or_create(pk=1, defaults={"nombre": "Festival de pruebas", "nombre_corto": "Festival E2E"})
            edition = Edicion.objects.create(nombre="Edición de prueba", anio=2026)
            category = Categoria.objects.create(edicion=edition, nombre="Acordeón profesional")
            poll = Votacion.objects.create(categoria=category, titulo="Encuentro de acordeoneros",
                                          descripcion="Conoce a los participantes de esta edición.")
            Opcion.objects.create(votacion=poll, nombre="Participante de prueba",
                                  descripcion="Biografía de muestra para verificar la ficha.",
                                  imagen="/static/img/music.png")
            call_command("runserver", "127.0.0.1:8011", use_reloader=False)
        finally:
            connections.close_all()


if __name__ == "__main__":
    main()
