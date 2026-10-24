import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const mailDirectory = fileURLToPath(new URL('../test-results/mail', import.meta.url));

test('loader moderno mientras se descarga una pantalla y al cambiar de ruta', async ({ page }, testInfo) => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/auth-*.js', async route => { await gate; await route.continue(); });
  await page.goto('/');
  await expect(page.locator('main h1')).toBeVisible();
  await page.getByRole('link', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page.locator('.page-loader')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('loader.png') });
  release();
  await expect(page.getByLabel('Nombre de usuario')).toBeVisible();
  await expect(page.locator('.page-loader')).toHaveCount(0);
});

function resetLink(email) {
  if (!existsSync(mailDirectory)) return '';
  for (const filename of readdirSync(mailDirectory)) {
    const body = readFileSync(`${mailDirectory}/${filename}`, 'utf8').replace(/=\r?\n/g, '');
    if (body.includes(email)) {
      const match = body.match(/http:\/\/127\.0\.0\.1:8011\/cuentas\/restablecer\/[^\s]+/);
      if (match) return match[0];
    }
  }
  return '';
}

test('registro, perfil, cierre de sesión e inicio de sesión reales', async ({ page }, testInfo) => {
  const username = `usuario_${testInfo.project.name}_${Date.now()}`;
  const password = 'Festival-Prueba-2026!';
  await page.goto('/cuentas/registro/');
  await page.getByLabel('Nombre de usuario').fill(username);
  await page.getByLabel('Nombre completo').fill('Persona de prueba');
  await page.getByLabel('Correo electrónico').fill(`${username}@example.com`);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByLabel('Confirmar contraseña').fill(password);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page).toHaveURL(/cuentas\/perfil\/$/);
  await page.getByLabel('Nombre completo').fill('Nombre actualizado');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByRole('status')).toContainText('Tus datos se actualizaron');
  await page.reload();
  await expect(page.getByLabel('Nombre completo')).toHaveValue('Nombre actualizado');
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/8011\/$/);
  await page.goto('/cuentas/login/');
  await page.getByLabel('Nombre de usuario').fill(username);
  await page.getByLabel('Contraseña', { exact: true }).fill('incorrecta');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.locator('.form-alert')).toBeVisible();
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page).toHaveURL(/cuentas\/perfil\/$/);
  await expect(page.getByLabel('Nombre completo')).toHaveValue('Nombre actualizado');
  await page.getByRole('link', { name: 'Cambiar contraseña' }).click();
  await page.getByLabel('Contraseña actual').fill(password);
  await page.getByLabel('Nueva contraseña', { exact: true }).fill('Festival-Cambiada-2026!');
  await page.getByLabel('Confirmar nueva contraseña').fill('Festival-Cambiada-2026!');
  await page.getByRole('button', { name: 'Cambiar contraseña' }).click();
  await expect(page.getByRole('status')).toContainText('Tu contraseña se actualizó');
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/8011\/$/);
  await page.goto('/cuentas/login/');
  await page.getByRole('link', { name: '¿Olvidaste tu contraseña?' }).click();
  await page.getByLabel('Correo electrónico').fill(`${username}@example.com`);
  await page.getByRole('button', { name: 'Enviar enlace de recuperación' }).click();
  await expect(page.getByRole('status')).toContainText('Si el correo está registrado');
  await expect.poll(() => resetLink(`${username}@example.com`)).toBeTruthy();
  const link = resetLink(`${username}@example.com`);
  await page.goto(link);
  await page.getByLabel('Nueva contraseña', { exact: true }).fill('Festival-Recuperada-2026!');
  await page.getByLabel('Confirmar nueva contraseña').fill('Festival-Recuperada-2026!');
  await page.getByRole('button', { name: 'Cambiar contraseña' }).click();
  await expect(page.getByRole('status')).toContainText('Tu contraseña se actualizó');
  await page.goto(link);
  await expect(page.getByRole('alert')).toContainText('Este enlace venció o ya fue utilizado');
  await page.goto('/cuentas/login/');
  await page.getByLabel('Nombre de usuario').fill(username);
  await page.getByLabel('Contraseña', { exact: true }).fill('Festival-Recuperada-2026!');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page).toHaveURL(/cuentas\/perfil\/$/);
});

test('subir imagen desde Admin y revisar los grupos de configuración', async ({ page }) => {
  await page.goto('/admin/');
  await page.getByLabel('Nombre de usuario').fill('admin_e2e');
  await page.locator('input[name="password"]').fill('Admin-Solo-Pruebas-2026!');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.goto('/admin/catalogo/opcion/1/change/');
  await page.locator('input[type="file"][name="imagen_archivo"]').setInputFiles(fileURLToPath(new URL('../../static/img/music.png', import.meta.url)));
  await expect(page.getByAltText('Vista previa del archivo seleccionado')).toBeVisible();
  await page.locator('input[name="_save"]').click();
  await page.goto('/votaciones/1/');
  await expect(page.locator('.participant-card>img')).toHaveAttribute('src', /\/media\/catalogo\//);
  await page.goto('/admin/catalogo/configuracionsitio/1/change/');
  await expect(page.getByText('Textos · Cuentas y contraseñas', { exact: true })).toBeVisible();
});

test('filtros, detalle, ficha accesible y regreso al listado', async ({ page }) => {
  await page.goto('/votaciones/');
  await page.getByRole('combobox', { name: 'Edición', exact: true }).selectOption({ label: 'Edición de prueba · 2026' });
  await page.getByRole('searchbox').fill('acordeoneros');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  const original = page.url();
  await page.getByRole('link', { name: 'Conocer participantes' }).click();
  await expect(page.getByRole('navigation', { name: 'Ruta de navegación' })).toContainText('Acordeón profesional');
  const trigger = page.getByRole('button', { name: 'Ver ficha: Participante de prueba' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Participante de prueba' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Biografía de muestra');
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await expect(dialog.getByRole('img', { name: 'Fotografía de Participante de prueba' })).toHaveAttribute('alt', 'Fotografía de Participante de prueba');
  await page.screenshot({ path: test.info().outputPath('ficha-participante.png') });
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.getByRole('link', { name: 'Volver al listado' }).click();
  await expect(page).toHaveURL(original);
  await expect(page.getByRole('searchbox')).toHaveValue('acordeoneros');
});

test('carga visible, error de servicio y recuperación al reintentar', async ({ page }) => {
  let release;
  const ready = new Promise(resolve => { release = resolve; });
  let first = true;
  await page.route('**/api/v1/votaciones/?*', async route => {
    if (first) {
      first = false;
      await ready;
      await route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Temporal"}' });
    } else await route.continue();
  });
  await page.goto('/votaciones/');
  await expect(page.locator('.catalog-loading')).toBeVisible();
  await expect(page.locator('.navigation-loader.is-loading')).toBeVisible();
  release();
  await expect(page.getByRole('alert')).toContainText('El servicio no está disponible');
  await page.getByRole('button', { name: 'Volver a intentar' }).click();
  await expect(page.getByRole('heading', { name: 'Encuentro de acordeoneros' })).toBeVisible();
  await expect(page.locator('.navigation-loader')).not.toHaveClass(/is-loading/);
});

test('accesibilidad de formularios y catálogo, teclado y pantallas estrechas', async ({ page }, testInfo) => {
  test.setTimeout(60000);
  if (testInfo.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 740 });
  for (const path of ['/', '/categorias/', '/votaciones/1/', '/cuentas/login/', '/cuentas/registro/', '/cuentas/recuperar/']) {
    await page.goto(path);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('.catalog-loading')).toHaveCount(0);
    for (const theme of ['light', 'dark']) {
      const toggle = page.getByRole('button', { name: theme === 'light' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro' });
      if (await toggle.count()) await toggle.click();
      await expect(page.locator('html')).not.toHaveClass(/theme-changing/);
      const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(accessibility.violations, `${path} (${theme})`).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path).toBe(true);
    }
  }
  await page.goto('/cuentas/login/');
  await expect(page.getByLabel('Nombre de usuario')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('resultados informativos y diseño sin desbordamiento en ambos temas', async ({ page }, testInfo) => {
  await page.goto('/resultados/');
  await expect(page.getByRole('heading', { name: 'Resultados aún no disponibles' })).toBeVisible();
  await expect(page.locator('.poll-meta')).toContainText('1 participante');
  await expect(page.locator('.poll-actions').getByRole('link', { name: 'Resultados' })).toHaveCount(0);
  for (const theme of ['light', 'dark']) {
    // Set through the public control so the application applies the same preference.
    const targetLabel = theme === 'light' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
    const toggle = page.getByRole('button', { name: targetLabel });
    if (await toggle.count()) await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.locator('html')).not.toHaveClass(/theme-changing/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(accessibility.violations).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`resultados-${theme}.png`), fullPage: true });
  }
  if (testInfo.project.name === 'mobile') {
    const reserved = await page.locator('main').evaluate(el => parseFloat(getComputedStyle(el).paddingBottom));
    const footer = await page.getByRole('contentinfo').boundingBox();
    expect(reserved).toBeGreaterThan(footer.height);
  }
});
