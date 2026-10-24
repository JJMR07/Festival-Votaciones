import { describe, expect, it, vi } from 'vitest';
import { createResourceCache } from '../app/resources';

describe('catálogo compartido', () => {
  it('comparte solicitudes simultáneas y reutiliza datos con parámetros equivalentes', async () => {
    const cache = createResourceCache();
    const fetcher = vi.fn(async () => ({ items: ['Acordeón'] }));
    const [first, second] = await Promise.all([
      cache.load('categorias/?edicion=1&limite=48', fetcher),
      cache.load('categorias/?limite=48&edicion=1', fetcher),
    ]);
    expect(first).toEqual(second);
    expect(fetcher).toHaveBeenCalledTimes(1);
    await cache.load('categorias/?edicion=1&limite=48', fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('renueva datos vencidos y al volver desde Admin', async () => {
    const cache = createResourceCache({ ttl: 50 });
    const clock = vi.spyOn(Date, 'now');
    const fetcher = vi.fn(async () => ({}));
    clock.mockReturnValue(0);
    await cache.load('ediciones/', fetcher);
    clock.mockReturnValue(100);
    await cache.load('ediciones/', fetcher);
    cache.clear();
    await cache.load('ediciones/', fetcher);
    expect(fetcher).toHaveBeenCalledTimes(3);
    clock.mockRestore();
  });

  it('no guarda errores ni respuestas privadas y permite reintentar', async () => {
    const cache = createResourceCache();
    const fetcher = vi.fn().mockRejectedValueOnce(new Error('sin red')).mockResolvedValue({});
    await expect(cache.load('categorias/', fetcher)).rejects.toThrow('sin red');
    await cache.load('categorias/', fetcher);
    cache.invalidate('categorias/');
    await cache.load('categorias/', fetcher);
    await cache.load('auth/sesion/', fetcher);
    await cache.load('auth/sesion/', fetcher);
    expect(fetcher).toHaveBeenCalledTimes(5);
  });
});
