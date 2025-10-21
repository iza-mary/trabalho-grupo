const API_BASE = "http://localhost:3000/api/eventos";

const parseJsonSafe = async (res) => {
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();
  if (!contentType.includes("application/json")) {
    throw new Error(`Resposta não-JSON (status ${res.status}): ${text.slice(0, 120)}`);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Falha ao parsear JSON: ${e.message}`);
  }
};

const eventosService = {
  async getAll() {
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} em /api/eventos`);
      }
      const data = await parseJsonSafe(res);
      if (data?.success) return data.data || [];
      // Fallback: alguns backends retornam lista direta
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("Erro ao carregar eventos:", err?.message || err);
      return [];
    }
  },

  async searchByTitulo(titulo = "") {
    try {
      const qs = new URLSearchParams({ titulo }).toString();
      const res = await fetch(`${API_BASE}/buscar?${qs}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} em /api/eventos/buscar`);
      }
      const data = await parseJsonSafe(res);
      if (data?.success) return data.data || [];
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("Erro ao buscar eventos:", err?.message || err);
      return [];
    }
  },
};

export default eventosService;