import React from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { AppProvider } from '../app/context';
import { Catalog, Home } from '../pages/catalog';

const textos = {
  categorias: 'Categorías', votaciones: 'Votaciones', resultados: 'Resultados',
  titulo_catalogo: 'Catálogo personalizado', descripcion_catalogo: 'Descripción personalizada',
  titulo_votaciones: 'Procesos personalizados', descripcion_votaciones: 'Descripción de procesos',
  titulo_resultados: 'Consulta personalizada', descripcion_resultados: 'Descripción de consulta',
  edicion: 'Edición', todas_ediciones: 'Todas las ediciones', categoria: 'Categoría',
  todas_categorias: 'Todas las categorías', buscar_label: 'Buscar', buscar: 'Buscar',
  aplicar: 'Aplicar', limpiar: 'Limpiar filtros', sin_datos: 'Sin publicaciones',
  sin_datos_ayuda: 'Regresa más adelante', cargando: 'Cargando',
  ver_detalle: 'Conocer participantes', opciones: 'Participantes',
  cierre_fecha: 'Cierre', sin_fecha: 'Por definir', estado_sin_fecha: 'Publicado',
  sin_votos: 'Consulta informativa', aviso_votos: 'Todavía no se registran votos ni se calculan resultados.',
  resultados_pendientes: 'Resultados aún no disponibles', resultados_alcance: 'Todavía no se registran votos ni se calculan resultados.',
};
const config = { nombre: 'Festival', nombre_corto: 'Festival', textos };
const poll = { id: 83, titulo: 'Proceso publicado', categoria_nombre: 'Acordeón', edicion_id: 7,
  categoria_id: 2, anio: 2026, estado: 'sin_fecha', total_opciones: 3 };
const response = data => ({ ok: true, status: 200, json: async () => data });
const listing = items => ({ items, total: items.length, pagina: 1, paginas: 1 });

function Location() { return <output aria-label="URL">{useLocation().search}</output>; }
function mount(element, path = '/') {
  return render(<MemoryRouter initialEntries={[path]}><AppProvider initialConfig={config}>
    {element}<Location/>
  </AppProvider></MemoryRouter>);
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async url => {
    if (url.includes('auth/sesion')) return response({ user: null, csrfToken: 'csrf' });
    if (url.includes('/votaciones/')) return response(listing([poll]));
    return response(listing([]));
  }));
});

it.each([
  ['categorias', 'Catálogo personalizado', 'Descripción personalizada'],
  ['votaciones', 'Procesos personalizados', 'Descripción de procesos'],
  ['resultados', 'Consulta personalizada', 'Descripción de consulta'],
])('usa los textos configurados en %s', async (kind, title, description) => {
  mount(<Catalog kind={kind}/>);
  expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
  expect(screen.getByText(description)).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByText('Cargando')).not.toBeInTheDocument());
});

it('permite quitar el filtro de edición recibido por URL en categorías', async () => {
  mount(<Catalog kind="categorias"/>, '/categorias/?edicion=7&pagina=2');
  expect(screen.getByRole('combobox', { name: 'Edición' })).toHaveValue('7');
  await waitFor(() => expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining('categorias/?edicion=7&pagina=2'), expect.anything()));
  fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
  expect(screen.getByLabelText('URL').textContent).toBe('');
  await waitFor(() => expect(fetch).toHaveBeenCalledWith(
    expect.stringMatching(/categorias\/\?$/), expect.anything()));
  expect(screen.getByRole('combobox', { name: 'Edición' })).toHaveValue('');
});

it('explica el inicio vacío al terminar la carga', async () => {
  mount(<Home/>);
  expect(await screen.findByRole('heading', { name: 'Sin publicaciones' })).toBeInTheDocument();
  expect(screen.getByText('Regresa más adelante')).toBeInTheDocument();
});

it('muestra el alcance informativo y enlaza al detalle desde resultados', async () => {
  mount(<Catalog kind="resultados"/>);
  expect(screen.getByText(textos.resultados_alcance)).toBeInTheDocument();
  expect(await screen.findByRole('link', { name: 'Conocer participantes' })).toHaveAttribute('href', '/votaciones/83/');
  expect(screen.queryByRole('link', { name: 'Resultados' })).not.toBeInTheDocument();
});

it('conserva el enlace a resultados en el listado de votaciones', async () => {
  mount(<Catalog kind="votaciones"/>);
  expect(await screen.findByRole('link', { name: 'Resultados' })).toHaveAttribute(
    'href', '/resultados/?edicion=7&categoria=2');
});
