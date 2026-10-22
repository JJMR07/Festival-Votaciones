from django.contrib.admin import AdminSite


class FestivalAdminSite(AdminSite):
    @property
    def index_title(self):
        from catalogo.models import ConfiguracionSitio
        from catalogo.serializers import configuracion_data
        return configuracion_data(ConfiguracionSitio.obtener())["textos"]["gestion"]

    def each_context(self, request):
        from catalogo.models import ConfiguracionSitio
        from catalogo.serializers import configuracion_data

        context = super().each_context(request)
        config = configuracion_data(ConfiguracionSitio.obtener())
        context.update(site_header=config["nombre"], site_title=config["nombre_corto"],
                       index_title=config["textos"]["gestion"])
        return context
