from django.core.management.base import BaseCommand
from django.utils import timezone

from catalogo.models import Categoria, Edicion, Opcion, Votacion


class Command(BaseCommand):
    help = "Carga datos de prueba (no son reglas confirmadas por el cliente)."

    def add_arguments(self, parser):
        parser.add_argument("--anio", type=int, default=2027)
        parser.add_argument("--nombre", default="Festival de la Leyenda Vallenata")

    def handle(self, *args, **options):
        edicion, creada = Edicion.objects.get_or_create(
            anio=options["anio"],
            nombre=options["nombre"],
            defaults={
                "descripcion": (
                    f"Edición de prueba {options['anio']} para la Entrega 2. "
                    "Los nombres de categorías se tomaron del prototipo HTML."
                ),
                "activa": True,
            },
        )
        # No reactivar ni sobrescribir contenido que el administrador haya editado.

        categorias_demo = [
            ("Rey Profesional", "Categoría de prueba tomada del prototipo de Entrega 1."),
            ("Rey Aficionado", "Categoría de prueba tomada del prototipo de Entrega 1."),
            ("Rey Infantil", "Categoría de prueba tomada del prototipo de Entrega 1."),
            ("Rey Juvenil", "Categoría de prueba tomada del prototipo de Entrega 1."),
        ]

        opciones_demo = [
            ("Opción de prueba A", "Dato de demostración"),
            ("Opción de prueba B", "Dato de demostración"),
            ("Opción de prueba C", "Dato de demostración"),
        ]

        ahora = timezone.now()
        for nombre, descripcion in categorias_demo:
            categoria, _ = Categoria.objects.get_or_create(
                edicion=edicion,
                nombre=nombre,
                defaults={"descripcion": descripcion},
            )
            votacion, _ = Votacion.objects.get_or_create(
                categoria=categoria,
                titulo=f"{nombre} {options['anio']}",
                defaults={
                    "descripcion": (
                        "Votación de prueba para mostrar la jerarquía "
                        "Edición → Categoría → Votación → Opción. "
                        "El registro definitivo del voto no forma parte de esta entrega."
                    ),
                    "fecha_inicio": ahora,
                    "fecha_cierre": None,
                    "publicada": True,
                },
            )
            for nombre_opcion, desc_opcion in opciones_demo:
                Opcion.objects.get_or_create(
                    votacion=votacion,
                    nombre=nombre_opcion,
                    defaults={"descripcion": desc_opcion, "activa": True},
                )

        self.stdout.write(self.style.SUCCESS("Datos de prueba listos."))
