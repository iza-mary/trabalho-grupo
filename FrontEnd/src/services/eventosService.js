const API_BASE = "http://localhost:3000/api/eventos";

const eventosService = {
  async getAll() {
    try {
      const resp = await fetch(`${API_BASE}`);
      const ct = resp.headers.get("content-type") || "";
      if (!resp.ok || !ct.includes("application/json")) {
        return [];
      }
      const json = await resp.json();
      return json?.data ?? [];
    } catch (_) {
      return [];
    }
  },

  async searchByTitulo(titulo = "") {
    try {
      const url = new URL(`${API_BASE}/search`);
      url.searchParams.set("titulo", titulo);
      const resp = await fetch(url);
      const ct = resp.headers.get("content-type") || "";
      if (!resp.ok || !ct.includes("application/json")) {
        return [];
      }
      const json = await resp.json();
      return json?.data ?? [];
    } catch (_) {
      return [];
    }
  },
};

export default eventosService;