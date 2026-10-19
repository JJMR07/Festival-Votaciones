from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse


class CuentasTests(TestCase):
    def test_registro_crea_usuario_e_inicia_sesion(self):
        respuesta = self.client.post(
            reverse("cuentas:registro"),
            {
                "username": "votante1",
                "first_name": "Ana Prueba",
                "email": "ana@example.com",
                "password1": "ClaveSegura2027",
                "password2": "ClaveSegura2027",
            },
        )
        self.assertEqual(respuesta.status_code, 302)
        self.assertTrue(User.objects.filter(username="votante1").exists())
        self.assertTrue(respuesta.wsgi_request.user.is_authenticated)

    def test_login_con_usuario_existente(self):
        User.objects.create_user(username="votante2", password="ClaveSegura2027")
        respuesta = self.client.post(
            reverse("cuentas:login"),
            {"username": "votante2", "password": "ClaveSegura2027"},
        )
        self.assertEqual(respuesta.status_code, 302)
