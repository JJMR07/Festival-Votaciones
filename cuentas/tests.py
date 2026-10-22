from django.contrib.auth import get_user_model
from django.test import Client, TestCase

from catalogo.models import ConfiguracionSitio


class CuentasTests(TestCase):
    def post(self, endpoint, data):
        return self.client.post(f"/api/v1/auth/{endpoint}/", data, content_type="application/json")

    def registro_data(self):
        return {"username": "votante", "first_name": "Ana Prueba", "email": "ana@example.com", "password1": "UnaClaveRobusta2027!", "password2": "UnaClaveRobusta2027!"}

    def test_registro_persistencia_y_sesion(self):
        response = self.post("registro", self.registro_data())
        self.assertEqual(response.status_code, 201)
        user = get_user_model().objects.get(username="votante")
        self.assertTrue(user.check_password("UnaClaveRobusta2027!"))
        self.assertEqual(self.client.get("/api/v1/auth/sesion/").json()["user"]["username"], "votante")
        self.assertNotIn("password", response.json()["user"])
        self.assertIn("csrfToken", response.json())

    def test_login_logout_reales(self):
        get_user_model().objects.create_user("votante", password="UnaClaveRobusta2027!")
        self.assertEqual(self.post("login", {"username": "votante", "password": "incorrecta"}).status_code, 400)
        self.assertEqual(self.post("login", {"username": "votante", "password": "UnaClaveRobusta2027!"}).status_code, 200)
        self.assertEqual(self.post("logout", {}).status_code, 200)
        self.assertIsNone(self.client.get("/api/v1/auth/sesion/").json()["user"])

    def test_registro_desactivado_por_admin(self):
        config = ConfiguracionSitio.obtener()
        config.registro_habilitado = False
        config.save()
        self.assertEqual(self.post("registro", self.registro_data()).status_code, 403)
        self.assertFalse(get_user_model().objects.exists())

    def test_registro_invalido_no_crea_usuario(self):
        data = self.registro_data()
        data["password2"] = "no coincide"
        response = self.post("registro", data)
        self.assertEqual(response.status_code, 400)
        self.assertIn("password2", response.json()["errors"])
        self.assertFalse(get_user_model().objects.exists())

    def test_usuario_duplicado(self):
        self.post("registro", self.registro_data())
        self.post("logout", {})
        self.assertEqual(self.post("registro", self.registro_data()).status_code, 400)
        self.assertEqual(get_user_model().objects.count(), 1)

    def test_perfil_solo_edita_campos_permitidos(self):
        self.assertEqual(self.post("perfil", {}).status_code, 401)
        self.post("registro", self.registro_data())
        self.assertEqual(self.post("perfil", {"first_name": "Nombre editado", "email": "otro@example.com", "is_staff": "true"}).status_code, 200)
        user = get_user_model().objects.get(username="votante")
        self.assertEqual(user.first_name, "Nombre editado")
        self.assertFalse(user.is_staff)

    def test_json_invalido(self):
        for value in ("no es json", "[]", '{"username": {"a": 1}}'):
            self.assertEqual(self.client.post("/api/v1/auth/login/", value, content_type="application/json").status_code, 400)

    def test_csrf_en_todas_las_escrituras_y_rotacion(self):
        client = Client(enforce_csrf_checks=True)
        session = client.get("/api/v1/auth/sesion/").json()
        for endpoint in ("login", "logout", "registro", "perfil"):
            self.assertEqual(client.post(f"/api/v1/auth/{endpoint}/", {}, content_type="application/json").status_code, 403)
        result = client.post("/api/v1/auth/registro/", self.registro_data(), content_type="application/json", HTTP_X_CSRFTOKEN=session["csrfToken"])
        self.assertEqual(result.status_code, 201)
        self.assertNotEqual(session["csrfToken"], result.json()["csrfToken"])
        self.assertEqual(client.post("/api/v1/auth/logout/", {}, content_type="application/json", HTTP_X_CSRFTOKEN=result.json()["csrfToken"]).status_code, 200)

    def test_no_cerrar_sesion_con_get(self):
        self.assertEqual(self.client.get("/api/v1/auth/logout/").status_code, 405)
        self.assertEqual(self.client.get("/cuentas/logout/").status_code, 405)
