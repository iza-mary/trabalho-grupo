// Adiciona utilitários para normalização de datas/horas
function normalizeDate(value) {
  if (!value) return null;
  // Se já vier como string YYYY-MM-DD
  if (typeof value === 'string') {
    const v = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    // ISO com timezone: 2025-10-18T03:00:00.000Z -> pega somente a parte da data
    if (v.includes('T')) return v.slice(0, 10);
    // Tenta parsear genericamente
    const d = new Date(v);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    }
    return v;
  }
  // Se veio como Date
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const dd = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }
  return String(value);
}

function normalizeTime(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    const v = value.trim();
    // HH:mm:ss já OK
    if (/^\d{2}:\d{2}:\d{2}$/.test(v)) return v;
    // HH:mm -> completa com :00
    if (/^\d{2}:\d{2}$/.test(v)) return `${v}:00`;
    return v;
  }
  // Se vier algum Date (incomum para TIME), extrai hora/min/seg
  if (value instanceof Date) {
    const h = String(value.getHours()).padStart(2, '0');
    const mi = String(value.getMinutes()).padStart(2, '0');
    const s = String(value.getSeconds()).padStart(2, '0');
    return `${h}:${mi}:${s}`;
  }
  return String(value);
}

class Evento {
  constructor(data) {
    this.id = data.id ?? null;
    this.titulo = data.titulo ?? null;
    this.tipo = data.tipo ?? null;
    this.cor = data.cor ?? null;
    this.dataInicio = data.dataInicio ?? data.data_inicio ?? null;
    this.dataFim = data.dataFim ?? data.data_fim ?? null;
    this.horaInicio = data.horaInicio ?? data.hora_inicio ?? null;
    this.horaFim = data.horaFim ?? data.hora_fim ?? null;
    this.local = data.local ?? null;
    this.descricao = data.descricao ?? null;
    this.notificar = data.notificar != null ? Number(data.notificar) === 1 || data.notificar === true : false;
    this.tempoNotificacao = data.tempoNotificacao != null ? Number(data.tempoNotificacao) : (data.tempo_notificacao != null ? Number(data.tempo_notificacao) : null);
  }

  validate() {
    const errors = [];
    if (!this.titulo || String(this.titulo).trim().length === 0) {
      errors.push("Título é obrigatório");
    }
    return errors;
  }

  toJSON() {
    return {
      id: this.id,
      titulo: this.titulo,
      tipo: this.tipo,
      cor: this.cor,
      dataInicio: normalizeDate(this.dataInicio),
      dataFim: normalizeDate(this.dataFim),
      horaInicio: normalizeTime(this.horaInicio),
      horaFim: normalizeTime(this.horaFim),
      local: this.local,
      descricao: this.descricao,
      notificar: !!this.notificar,
      tempoNotificacao: this.tempoNotificacao,
    };
  }
}

module.exports = Evento;
/*
  Modelo Evento
  - Intervalos de datas, título e descrição de eventos.
*/