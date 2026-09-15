export function formatDate(value?: string) {
  if (!value) {
    return '---';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatText(value?: string | null) {
  return value && value.trim() ? value : '---';
}

export function formatNumber(value?: number | null) {
  if (value === undefined || value === null) {
    return '---';
  }

  return new Intl.NumberFormat('es-CL').format(value);
}
