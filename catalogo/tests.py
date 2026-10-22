from datetime import timedelta
from io import StringIO

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.db import connection, IntegrityError, transaction
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from django.utils import timezone

from .defaults import textos_iniciales
from .models import Categoria, ConfiguracionSitio, Edicion, Opcion, Votacion


class CatalogoTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.edicion = Edicion.objects.create(nombre="Festival de prueba", anio=2030)
        cls.categoria = Categoria.objects.create(edicion=cls.edicion, nombre="Talento regional")
        cls.votacion = Votacion.objects.create(categoria=cls.categoria, titulo="Una votación configurable")
        cls.opcion = Opcion.objects.create(votacion=cls.votacion, nombre="Participante editable")

    def test_relaciones(self):
        self.assertEqual(self.votacion.categoria.edicion, self.edicion)
        self.assertEqual(self.votacion.opciones.get(), self.opcion)

    def test_nombres_editados_se_reflejan_en_api(self):
        self.categoria.nombre = "Nueva categoría sin tocar React"
        self.categoria.save()
        self.votacion.titulo = "Nuevo título sin tocar React"
        self.votacion.save()
        self.opcion.nombre = "Nombre actualizado"
        self.opcion.save()
        data = self.client.get(f"/api/v1/votaciones/{self.votacion.pk}/").json()
        self.assertEqual(data["categoria_nombre"], self.categoria.nombre)
        self.assertEqual(data["titulo"], self.votacion.titulo)
        self.assertEqual(data["opciones"]["items"][0]["nombre"], self.opcion.nombre)

    def test_interfaz_react_con_configuracion_de_postgresql(self):
        for route in ("/", "/ediciones/", "/categorias/", "/votaciones/", "/resultados/", "/cuentas/login/"):
            response = self.client.get(route)
            self.assertEqual(response.status_code, 200)
            self.assertTemplateUsed(response, "react.html")
            self.assertContains(response, 'id="app-bootstrap"')

    def test_ediciones_sin_limitar_a_un_anio(self):
        Edicion.objects.create(nombre="Otro festival", anio=2035)
        data = self.client.get("/api/v1/ediciones/").json()
        self.assertEqual(data["total"], 2)
        self.assertEqual({e["anio"] for e in data["items"]}, {2030, 2035})

    def test_ocultar_edicion_oculta_toda_la_jerarquia(self):
        self.edicion.activa = False
        self.edicion.save()
        for endpoint in ("ediciones", "categorias", "votaciones"):
            self.assertEqual(self.client.get(f"/api/v1/{endpoint}/").json()["total"], 0)
        self.assertEqual(self.client.get(f"/api/v1/votaciones/{self.votacion.pk}/").status_code, 404)
        self.assertEqual(self.client.get(f"/votaciones/{self.votacion.pk}/").status_code, 404)

    def test_ocultar_categoria_oculta_votaciones(self):
        self.categoria.publicada = False
        self.categoria.save()
        self.assertEqual(self.client.get("/api/v1/categorias/").json()["total"], 0)
        self.assertEqual(self.client.get("/api/v1/votaciones/").json()["total"], 0)
        self.assertEqual(self.client.get("/api/v1/ediciones/").json()["items"][0]["total_categorias"], 0)

    def test_votaciones_y_opciones_no_publicadas_no_se_filtran(self):
        Opcion.objects.create(votacion=self.votacion, nombre="Borrador", activa=False)
        data = self.client.get(f"/api/v1/votaciones/{self.votacion.pk}/").json()
        self.assertEqual(data["total_opciones"], 1)
        self.assertEqual(data["opciones"]["total"], 1)
        self.votacion.publicada = False
        self.votacion.save()
        self.assertEqual(self.client.get(f"/api/v1/votaciones/{self.votacion.pk}/").status_code, 404)

    def test_filtros_busqueda_y_paginacion(self):
        for i in range(15):
            Votacion.objects.create(categoria=self.categoria, titulo=f"Convocatoria {i:02}")
        otra = Categoria.objects.create(edicion=self.edicion, nombre="Otra")
        Votacion.objects.create(categoria=otra, titulo="No debe aparecer")
        url = f"/api/v1/votaciones/?categoria={self.categoria.pk}&q=Convocatoria&limite=5&pagina=2"
        data = self.client.get(url).json()
        self.assertEqual((data["total"], len(data["items"]), data["paginas"]), (15, 5, 3))
        self.assertEqual(data["items"][0]["titulo"], "Convocatoria 05")
        self.assertEqual(self.client.get("/api/v1/categorias/?edicion=9999").json()["total"], 0)

    def test_orden_configurable(self):
        first = Categoria.objects.create(edicion=self.edicion, nombre="Z primero", orden=0)
        self.categoria.orden = 10
        self.categoria.save()
        self.assertEqual(self.client.get("/api/v1/categorias/").json()["items"][0]["id"], first.pk)

    def test_paginacion_de_participantes(self):
        Opcion.objects.bulk_create([Opcion(votacion=self.votacion, nombre=f"Opción {i}") for i in range(14)])
        data = self.client.get(f"/api/v1/votaciones/{self.votacion.pk}/?pagina=2").json()
        self.assertEqual(len(data["opciones"]["items"]), 3)
        self.assertEqual(data["opciones"]["total"], 15)

    def test_parametros_invalidos(self):
        for query in ("pagina=0", "pagina=no", "limite=999", "edicion=abc", "categoria=-1"):
            self.assertEqual(self.client.get(f"/api/v1/votaciones/?{query}").status_code, 400)
        self.assertEqual(self.client.get("/api/v1/votaciones/?pagina=999").status_code, 404)

    def test_estados_dependen_de_fechas(self):
        now = timezone.now()
        for inicio, cierre, estado in ((None, None, "sin_fecha"), (now + timedelta(days=1), None, "programada"), (now - timedelta(days=1), None, "abierta"), (now - timedelta(days=2), now - timedelta(days=1), "cerrada")):
            self.votacion.fecha_inicio, self.votacion.fecha_cierre = inicio, cierre
            self.votacion.save()
            self.assertEqual(self.client.get(f"/api/v1/votaciones/{self.votacion.pk}/").json()["estado"], estado)

    def test_fechas_incoherentes_rechazadas_en_modelo_y_base(self):
        self.votacion.fecha_inicio = timezone.now()
        self.votacion.fecha_cierre = timezone.now() - timedelta(days=1)
        with self.assertRaises(ValidationError):
            self.votacion.full_clean()
        with self.assertRaises(IntegrityError), transaction.atomic():
            self.votacion.save()

    def test_consultas_no_crecen_por_cada_votacion(self):
        with CaptureQueriesContext(connection) as initial:
            self.client.get("/api/v1/votaciones/")
        Votacion.objects.bulk_create([Votacion(categoria=self.categoria, titulo=f"Escenario {i}") for i in range(30)])
        with CaptureQueriesContext(connection) as expanded:
            self.client.get("/api/v1/votaciones/")
        self.assertEqual(len(initial), len(expanded))
        self.assertLessEqual(len(expanded), 3)

    def test_api_catalogo_solo_lectura(self):
        for endpoint in ("ediciones", "categorias", "votaciones", "configuracion"):
            self.assertEqual(self.client.post(f"/api/v1/{endpoint}/", {}).status_code, 405)

    def test_datos_demo_idempotentes_no_reactivan_edicion(self):
        call_command("cargar_datos_prueba", stdout=StringIO())
        demo = Edicion.objects.get(anio=2027)
        demo.activa = False
        demo.save()
        call_command("cargar_datos_prueba", stdout=StringIO())
        demo.refresh_from_db()
        self.assertFalse(demo.activa)
        self.assertEqual(demo.categorias.count(), 4)


class ConfiguracionTests(TestCase):
    def test_cambiar_marca_y_textos_sin_recompilar(self):
        config = ConfiguracionSitio.obtener()
        config.nombre = "Festival de la costa"
        config.color_primario = "#123456"
        config.textos = {"titulo_inicio": "Un título diferente"}
        config.save()
        data = self.client.get("/api/v1/configuracion/").json()
        self.assertEqual(data["nombre"], config.nombre)
        self.assertEqual(data["textos"]["titulo_inicio"], "Un título diferente")
        self.assertEqual(data["textos"]["entrar"], textos_iniciales()["entrar"])
        self.assertContains(self.client.get("/"), "Festival de la costa")

    def test_json_seguro_en_plantilla(self):
        config = ConfiguracionSitio.obtener()
        config.textos = {"titulo_inicio": "</script><script>alert(1)</script>"}
        config.save()
        self.assertNotContains(self.client.get("/"), "</script><script>alert(1)</script>")

    def test_validadores_de_configuracion(self):
        for field, value in (("color_primario", "red;display:none"), ("imagen_portada", "javascript:alert(1)"), ("textos", []), ("textos", {"inventado": "texto"}), ("textos", {"entrar": 3})):
            config = ConfiguracionSitio(pk=1)
            setattr(config, field, value)
            with self.assertRaises(ValidationError):
                config.full_clean(validate_unique=False, validate_constraints=False)

    def test_get_sin_configuracion_no_escribe_datos(self):
        ConfiguracionSitio.objects.all().delete()
        self.assertEqual(self.client.get("/api/v1/configuracion/").status_code, 200)
        self.assertFalse(ConfiguracionSitio.objects.exists())

    def test_admin_exige_autorizacion(self):
        response = self.client.get("/admin/catalogo/configuracionsitio/1/change/")
        self.assertEqual(response.status_code, 302)
        user = get_user_model().objects.create_user("visitante", password="EjemploSeguro2027")
        self.client.force_login(user)
        self.assertEqual(self.client.get("/admin/catalogo/categoria/").status_code, 302)

    def test_admin_puede_cambiar_nombre_y_configuracion(self):
        user = get_user_model().objects.create_superuser("admin_test", "test@example.com", "EjemploSeguro2027")
        self.client.force_login(user)
        self.assertEqual(self.client.get("/admin/catalogo/configuracionsitio/1/change/").status_code, 200)
        edicion = Edicion.objects.create(nombre="Edición", anio=2035)
        data = {"nombre": "Edición renombrada", "anio": "2035", "descripcion": "", "activa": "on", "orden": "0", "imagen": "", "categorias-TOTAL_FORMS": "0", "categorias-INITIAL_FORMS": "0"}
        self.assertEqual(self.client.post(f"/admin/catalogo/edicion/{edicion.pk}/change/", data).status_code, 302)
        edicion.refresh_from_db()
        self.assertEqual(edicion.nombre, "Edición renombrada")
