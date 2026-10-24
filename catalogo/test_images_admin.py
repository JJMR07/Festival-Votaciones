from io import BytesIO
from tempfile import TemporaryDirectory

from PIL import Image
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings

from .admin import grupos_textos
from .defaults import textos_iniciales
from .models import ConfiguracionSitio, Edicion
from .serializers import imagen_url


def image_file(name="foto.png", dimensions=(32, 32)):
    buffer = BytesIO()
    Image.new("RGB", dimensions, color="red").save(buffer, "PNG")
    return SimpleUploadedFile(name, buffer.getvalue(), content_type="image/png")


class ImagesAdminTests(TestCase):
    def setUp(self):
        self.directory = TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.settings_override = override_settings(MEDIA_ROOT=self.directory.name)
        self.settings_override.enable()
        self.addCleanup(self.settings_override.disable)
        self.edicion = Edicion.objects.create(nombre="Ejemplo", anio=2026, imagen="/static/img/music.png")
        self.user = get_user_model().objects.create_superuser("admin_images", "admin@example.com", "Festival-Test-2026!")
        self.client.force_login(self.user)

    def test_subida_real_por_admin_y_prioridad_sobre_url(self):
        data = {"nombre": "Ejemplo", "anio": "2026", "descripcion": "", "activa": "on", "orden": "0",
                "imagen": "/static/img/music.png", "imagen_archivo": image_file(),
                "categorias-TOTAL_FORMS": "0", "categorias-INITIAL_FORMS": "0"}
        response = self.client.post(f"/admin/catalogo/edicion/{self.edicion.pk}/change/", data)
        self.assertEqual(response.status_code, 302)
        self.edicion.refresh_from_db()
        self.assertTrue(imagen_url(self.edicion).startswith("/media/catalogo/"))
        self.assertEqual(self.client.get("/api/v1/ediciones/").json()["items"][0]["imagen"], imagen_url(self.edicion))
        self.assertContains(self.client.get(f"/admin/catalogo/edicion/{self.edicion.pk}/change/"), "Vista previa")
        self.edicion.imagen_archivo = ""
        self.assertEqual(imagen_url(self.edicion), "/static/img/music.png")

    def test_rechaza_archivos_falsos_grandes_y_dimensiones_excesivas(self):
        invalid = [SimpleUploadedFile("foto.png", b"no-es-imagen"), image_file(dimensions=(4097, 1)), image_file("foto.svg")]
        large = image_file()
        large.size = 5 * 1024 * 1024 + 1
        invalid.append(large)
        for archivo in invalid:
            with self.subTest(name=archivo.name):
                self.edicion.imagen_archivo = archivo
                with self.assertRaises(ValidationError):
                    self.edicion.full_clean()

    def test_ocultar_y_publicar_con_acciones_admin(self):
        path = "/admin/catalogo/edicion/"
        self.client.post(path, {"action": "ocultar", "_selected_action": [self.edicion.pk]})
        self.assertEqual(self.client.get("/api/v1/ediciones/").json()["total"], 0)
        self.client.post(path, {"action": "publicar", "_selected_action": [self.edicion.pk]})
        self.assertEqual(self.client.get("/api/v1/ediciones/").json()["total"], 1)

    def test_todos_los_textos_aparecen_en_un_solo_grupo(self):
        fields = [field for _, options in grupos_textos() for field in options["fields"]]
        self.assertEqual(len(fields), len(set(fields)))
        self.assertEqual(set(fields), {f"texto_{key}" for key in textos_iniciales()})

    def test_crear_configuracion_sin_imagenes_previas(self):
        ConfiguracionSitio.objects.all().delete()
        self.assertEqual(self.client.get('/admin/catalogo/configuracionsitio/add/').status_code, 200)
