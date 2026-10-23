export function formatDate(value, fallback = '') {
  return value ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'America/Bogota' }).format(new Date(value)) : fallback;
}
