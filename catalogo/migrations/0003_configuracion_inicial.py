from django.db import migrations


def crear_configuracion(apps, schema_editor):
    apps.get_model("catalogo", "ConfiguracionSitio").objects.get_or_create(pk=1)


class Migration(migrations.Migration):
    dependencies = [("catalogo", "0002_configuracionsitio_alter_categoria_options_and_more")]
    operations = [migrations.RunPython(crear_configuracion, migrations.RunPython.noop)]
