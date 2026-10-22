from django import forms
from .defaults import textos_iniciales
from .models import ConfiguracionSitio
from .validators import validar_textos


class BaseConfiguracionForm(forms.ModelForm):
    class Meta:
        model = ConfiguracionSitio
        exclude = ("textos",)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        textos = {**textos_iniciales(), **(self.instance.textos or {})}
        for clave, valor in textos.items():
            self.fields[f"texto_{clave}"].initial = valor

    def clean(self):
        cleaned = super().clean()
        textos = {clave: cleaned.get(f"texto_{clave}", valor) for clave, valor in textos_iniciales().items()}
        validar_textos(textos)
        self.instance.textos = textos
        return cleaned


# Campos normales, con etiquetas en español: el administrador no necesita editar JSON.
ConfiguracionForm = type("ConfiguracionForm", (BaseConfiguracionForm,), {
    f"texto_{clave}": forms.CharField(
        label=clave.replace("_", " ").capitalize(), max_length=2000,
        widget=forms.Textarea(attrs={"rows": 2, "cols": 85}) if len(valor) > 75 or "\n" in valor else forms.TextInput(attrs={"size": 75}),
    ) for clave, valor in textos_iniciales().items()
})
