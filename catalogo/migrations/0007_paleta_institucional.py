from django.db import migrations


def actualizar_paleta(apps, schema_editor):
    config = apps.get_model("catalogo", "ConfiguracionSitio")
    # Actualiza sólo la paleta anterior por defecto: conserva personalizaciones.
    config.objects.filter(color_primario="#185442").update(color_primario="#dd3333")
    config.objects.filter(color_acento="#e7b95c").update(color_acento="#e9d294")


class Migration(migrations.Migration):
    dependencies = [("catalogo", "0006_alter_configuracionsitio_color_acento_and_more")]
    operations = [migrations.RunPython(actualizar_paleta, migrations.RunPython.noop)]
