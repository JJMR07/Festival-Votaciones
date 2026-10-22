import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("catalogo", "0005_alter_edicion_activa")]
    operations = [
        migrations.AlterField(
            model_name="configuracionsitio", name="color_acento",
            field=models.CharField(default="#e9d294", max_length=7, validators=[django.core.validators.RegexValidator(r"^#[0-9a-fA-F]{6}$", "Usa un color hexadecimal.")]),
        ),
        migrations.AlterField(
            model_name="configuracionsitio", name="color_primario",
            field=models.CharField(default="#dd3333", max_length=7, validators=[django.core.validators.RegexValidator(r"^#[0-9a-fA-F]{6}$", "Usa un color hexadecimal, por ejemplo #dd3333.")]),
        ),
    ]
