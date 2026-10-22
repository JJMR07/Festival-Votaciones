from django.contrib.admin.apps import AdminConfig


class FestivalAdminConfig(AdminConfig):
    default_site = "config.admin_site.FestivalAdminSite"
