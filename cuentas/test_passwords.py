import re
from datetime import datetime, timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.test import Client, TestCase, override_settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class PasswordTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user("persona", email="persona@example.com", password="Festival-Antigua-2026!")

    def post(self, path, data):
        return self.client.post(f"/api/v1/auth/contrasena/{path}/", data, content_type="application/json")

    def reset_path(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)
        return f"restablecer/{uid}/{token}"

    def test_recuperacion_envia_enlace_y_no_revela_si_existe_correo(self):
        known = self.post("recuperar", {"email": self.user.email})
        unknown = self.post("recuperar", {"email": "desconocida@example.com"})
        self.assertEqual(known.json(), unknown.json())
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [self.user.email])
        link = re.search(r"http://testserver(/cuentas/restablecer/\S+)", mail.outbox[0].body)
        self.assertIsNotNone(link)
        self.assertEqual(self.client.get(link[1]).status_code, 200)

    def test_token_es_de_un_solo_uso_y_cambia_clave(self):
        path = self.reset_path()
        self.assertEqual(self.client.get(f"/api/v1/auth/contrasena/{path}/").status_code, 200)
        data = {"new_password1": "Festival-Nueva-2026!", "new_password2": "Festival-Nueva-2026!"}
        self.assertEqual(self.post(path, data).status_code, 200)
        self.assertEqual(self.post(path, data).status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(data["new_password1"]))

    def test_tokens_invalidos_vencidos_e_inactivos(self):
        path = self.reset_path()
        with patch.object(default_token_generator, "_now", return_value=datetime.now() + timedelta(hours=2)):
            self.assertEqual(self.client.get(f"/api/v1/auth/contrasena/{path}/").status_code, 400)
        self.assertEqual(self.post("restablecer/INVALIDO/no-valido", {}).status_code, 400)
        self.user.is_active = False
        self.user.save()
        self.assertEqual(self.post(path, {}).status_code, 400)

    def test_cambiar_requiere_sesion_y_contrasena_actual_y_conserva_sesion(self):
        data = {"old_password": "incorrecta", "new_password1": "Festival-Nueva-2026!", "new_password2": "Festival-Nueva-2026!"}
        self.assertEqual(self.post("cambiar", data).status_code, 401)
        self.client.force_login(self.user)
        self.assertIn("old_password", self.post("cambiar", data).json()["errors"])
        data["old_password"] = "Festival-Antigua-2026!"
        self.assertEqual(self.post("cambiar", data).status_code, 200)
        self.assertEqual(self.client.get("/api/v1/auth/sesion/").json()["user"]["username"], "persona")

    def test_validacion_de_claves_y_csrf(self):
        path = self.reset_path()
        self.assertEqual(self.post(path, {"new_password1": "123", "new_password2": "123"}).status_code, 400)
        self.assertEqual(self.post("recuperar", {"email": "invalido"}).status_code, 400)
        csrf_client = Client(enforce_csrf_checks=True)
        csrf_client.force_login(self.user)
        for endpoint in ("cambiar", "recuperar", path):
            self.assertEqual(csrf_client.post(f"/api/v1/auth/contrasena/{endpoint}/", {}, content_type="application/json").status_code, 403)
