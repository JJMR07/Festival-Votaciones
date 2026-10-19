from django.test import TestCase
from django.urls import reverse

from .models import Categoria, Edicion, Opcion, Votacion


class CatalogoTests(TestCase):
    def setUp(self):
        self.edicion = Edicion.objects.create(
            nombre="Festival de prueba",
            anio=2027,
            activa=True,
        )
        self.categoria = Categoria.objects.create(
            edicion=self.edicion,
            nombre="Rey Profesional",
            descripcion="Dato de prueba",
        )
        self.votacion = Votacion.objects.create(
            categoria=self.categoria,
            titulo="Rey Profesional 2027",
            publicada=True,
        )
        Opcion.objects.create(votacion=self.votacion, nombre="Opción A", activa=True)

    def test_relacion_edicion_categoria_votacion_opcion(self):
        self.assertEqual(self.categoria.edicion, self.edicion)
        self.assertEqual(self.votacion.categoria, self.categoria)
        self.assertEqual(self.votacion.opciones.count(), 1)

    def test_inicio_muestra_datos_reales(self):
        respuesta = self.client.get(reverse("catalogo:inicio"))
        self.assertEqual(respuesta.status_code, 200)
        self.assertContains(respuesta, "Rey Profesional")

    def test_detalle_votacion_muestra_opciones(self):
        respuesta = self.client.get(reverse("catalogo:detalle", args=[self.votacion.pk]))
        self.assertEqual(respuesta.status_code, 200)
        self.assertContains(respuesta, "Opción A")
