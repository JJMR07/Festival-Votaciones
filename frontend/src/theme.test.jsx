import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { THEME_KEY, readTheme, useTheme } from './theme';

let media;
let change;
beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  media = { matches: false, addEventListener: vi.fn((event, handler) => { change = handler; }), removeEventListener: vi.fn() };
  vi.stubGlobal('matchMedia', vi.fn(() => media));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('preferencias de apariencia', () => {
  it('usa la preferencia del sistema cuando no hay elección guardada', () => {
    media.matches = true;
    const { result } = renderHook(useTheme);
    expect(result.current.theme).toBe('system');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('conserva el modo elegido después de volver a montar la aplicación', () => {
    const first = renderHook(useTheme);
    act(() => first.result.current.setTheme('dark'));
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
    first.unmount();
    const second = renderHook(useTheme);
    expect(second.result.current.resolvedTheme).toBe('dark');
    act(() => second.result.current.setTheme('light'));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });

  it('reacciona a cambios del sistema sólo en modo automático', () => {
    const { result } = renderHook(useTheme);
    act(() => change({ matches: true }));
    expect(result.current.resolvedTheme).toBe('dark');
    act(() => result.current.setTheme('light'));
    act(() => change({ matches: true }));
    expect(result.current.resolvedTheme).toBe('light');
    act(() => result.current.setTheme('system'));
    expect(result.current.resolvedTheme).toBe('dark');
  });

  it('sincroniza el tema elegido en otra pestaña', () => {
    const { result } = renderHook(useTheme);
    act(() => { localStorage.setItem(THEME_KEY, 'dark'); window.dispatchEvent(new StorageEvent('storage', { key: THEME_KEY })); });
    expect(result.current.theme).toBe('dark');
  });

  it('tolera preferencias inválidas y almacenamiento bloqueado', () => {
    localStorage.setItem(THEME_KEY, 'valor-invalido');
    expect(readTheme()).toBe('system');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqueado'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('bloqueado'); });
    const { result } = renderHook(useTheme);
    act(() => result.current.setTheme('dark'));
    expect(result.current.resolvedTheme).toBe('dark');
    act(() => result.current.setTheme('otro'));
    expect(result.current.theme).toBe('dark');
  });

  it('aplica el mismo modo antes de cargar React, incluso sin acceso a almacenamiento', () => {
    const script = readFileSync(resolve(process.cwd(), '../static/js/theme-init.js'), 'utf8');
    for (const [saved, system, expected] of [['dark', false, 'dark'], ['light', true, 'light'], ['system', true, 'dark'], ['incorrecto', false, 'light']]) {
      const root = { dataset: {}, style: {} };
      vm.runInNewContext(script, { localStorage: { getItem: () => saved }, window: { matchMedia: () => ({ matches: system }) }, document: { documentElement: root } });
      expect(root.dataset.theme).toBe(expected);
      expect(root.style.colorScheme).toBe(expected);
    }
    const root = { dataset: {}, style: {} };
    vm.runInNewContext(script, { localStorage: { getItem: () => { throw new Error('bloqueado'); } }, window: { matchMedia: () => ({ matches: true }) }, document: { documentElement: root } });
    expect(root.dataset.theme).toBe('dark');
  });
});
