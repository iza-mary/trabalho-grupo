export function formatDate(raw) {
  if (!raw) return '-';
  try {
    const d = typeof raw === 'string' ? new Date(raw) : raw;
    if (!(d instanceof Date) || isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
}

export function formatDateTime(raw) {
  if (!raw) return '-';
  try {
    const d = typeof raw === 'string' ? new Date(raw) : raw;
    if (!(d instanceof Date) || isNaN(d.getTime())) return '-';
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '-';
  }
}
/*
  Utilitários de Data
  - Funções para formatar e operar datas em padrão brasileiro.
*/