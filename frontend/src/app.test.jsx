import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from './context';
import { AuthPage } from './auth';
import { CatalogCard, Filters, Notice, ResourceState } from './components';
import { api, post } from './api';

const config = { nombre: 'Festival editable', nombre_corto: 'Festival', logo: '/static/img/logo.png', imagen_predeterminada: '/static/img/music.png', registro_habilitado: true, color_primario: '#185442', color_acento: '#e7b95c', textos: { entrar: 'Entrar personalizado', registro: 'Crear cuenta', titulo_login: 'Título editable', descripcion_login: 'Texto editable', usuario: 'Usuario', contrasena: 'Contraseña', enviando: 'Enviando', error_formulario: 'Revisa los campos', sesion_expirada: 'Sesión caducada', error: 'Error de conexión', aplicar: 'Buscar', buscar_label: 'Buscar', buscar: 'Buscar...', edicion: 'Edición', todas_ediciones: 'Todas', limpiar: 'Limpiar', sin_votos: 'Consulta', aviso_votos: 'El voto no está habilitado', ver_detalle: 'Ver', estado_sin_fecha: 'Publicado', opciones: 'Participantes', sin_descripcion: 'Sin descripción', reintentar: 'Reintentar', no_encontrado: 'No encontrado' } };

function response(data, status = 200) { return { ok: status < 400, status, json: async () => data }; }
function wrap(element, custom = config) { return render(<MemoryRouter><AppProvider initialConfig={custom}>{element}</AppProvider></MemoryRouter>); }

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async url => {
    if (url.includes('auth/sesion')) return response({ user: null, csrfToken: 'csrf-prueba' });
    return response({ items: [], total: 0, pagina: 1, paginas: 1 });
  }));
});

describe('interfaz conectada a configuración', () => {
  it('muestra nombres y enlaces recibidos del backend sin títulos fijos', () => {
    wrap(<CatalogCard kind="votaciones" item={{ id: 83, titulo: 'Votación nueva', categoria_nombre: 'Categoría nueva', anio: 2034, total_opciones: 7, estado: 'sin_fecha' }}/>);
    expect(screen.getByRole('link', { name: 'Votación nueva' })).toHaveAttribute('href', '/votaciones/83/');
    expect(screen.getByText('Categoría nueva')).toBeInTheDocument();
    expect(screen.getByText('7 participantes')).toBeInTheDocument();
  });
  it('muestra el aviso informativo y no ofrece emitir votos', () => {
    wrap(<Notice/>);
    expect(screen.getByText('El voto no está habilitado')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
  it('permite reintentar ante un error de red', () => {
    const retry = vi.fn();
    wrap(<ResourceState resource={{ loading: false, error: new Error('fallo'), retry }}/>);
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(retry).toHaveBeenCalledOnce();
  });
  it('la búsqueda conserva filtros y reinicia la paginación', () => {
    const setParams = vi.fn();
    wrap(<Filters params={new URLSearchParams('edicion=7&pagina=4')} setParams={setParams} showEditions={false}/>);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Acordeón' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(setParams.mock.calls[0][0].get('q')).toBe('Acordeón');
    expect(setParams.mock.calls[0][0].get('edicion')).toBe('7');
    expect(setParams.mock.calls[0][0].has('pagina')).toBe(false);
  });
  it('envía login a Django y muestra sus errores reales', async () => {
    fetch.mockImplementation(async url => url.includes('auth/login') ? response({ errors: { __all__: [{ message: 'Credenciales incorrectas' }] } }, 400) : response({ user: null, csrfToken: 'csrf-prueba' }));
    wrap(<AuthPage/>);
    expect(screen.getByText('Título editable')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Entrar personalizado' });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'ana' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'incorrecta' } });
    fireEvent.click(button);
    expect(await screen.findByText('Credenciales incorrectas')).toBeInTheDocument();
    const call = fetch.mock.calls.find(([url]) => url.includes('auth/login'));
    expect(JSON.parse(call[1].body)).toEqual({ username: 'ana', password: 'incorrecta' });
    expect(call[1].headers['X-CSRFToken']).toBe('csrf-prueba');
  });
});

describe('cliente de API', () => {
  it('renueva el token CSRF después de autenticar', async () => {
    fetch.mockResolvedValueOnce(response({ csrfToken: 'token-anterior' })).mockResolvedValueOnce(response({ csrfToken: 'token-nuevo' })).mockResolvedValueOnce(response({}));
    await api('auth/sesion/'); await post('auth/login/', {}); await post('auth/logout/', {});
    expect(fetch.mock.calls[2][1].headers['X-CSRFToken']).toBe('token-nuevo');
    expect(fetch.mock.calls[2][1].credentials).toBe('same-origin');
  });
  it('gestiona respuestas no JSON sin perder el estado HTTP', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 403, json: async () => { throw new Error('HTML'); } });
    await expect(post('auth/login/', {})).rejects.toMatchObject({ status: 403 });
  });
});
