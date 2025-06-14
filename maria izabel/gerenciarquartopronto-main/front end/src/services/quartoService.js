const API_BASE_URL = 'http://localhost:3001/api/quartos';

const handleResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    const message = data?.message || `HTTP error! status: ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  if (!data.success) {
    const err = new Error(data.message || 'Erro na requisição');
    err.status = response.status;
    throw err;
  }

  return data;
};

const mapQuarto = (quarto) => ({
  ...quarto,
  observacao: quarto.observacao || '',
  dailyValue: null,
});

const getAll = async () => {
  try {
    const response = await fetch(API_BASE_URL);
    const result = await handleResponse(response);
    return result.data.map(mapQuarto);
  } catch (error) {
    console.error('Erro ao buscar quartos: ', error);
    throw error;
  }
};

const getById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    const result = await handleResponse(response);
    return mapQuarto(result.data);
  } catch (error) {
    console.error('Erro ao buscar quarto por ID: ', error);
    throw error;
  }
};

const add = async (quarto) => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        numero: parseInt(quarto.numero),
        tipo: quarto.tipo,
        leitos: parseInt(quarto.leitos),
        andar: parseInt(quarto.andar),
        observacao: quarto.observacao || null,
        ocupacao: quarto.ocupacao ?? 0,
        status: quarto.status || 'Disponível',
      }),
    });
    const result = await handleResponse(response);
    return mapQuarto(result.data);
  } catch (error) {
    console.error('Erro ao adicionar quarto: ', error);
    throw error;
  }
};

const update = async (id, quarto) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        numero: parseInt(quarto.numero),
        tipo: quarto.tipo,
        leitos: parseInt(quarto.leitos),
        andar: parseInt(quarto.andar),
        observacao: quarto.observacao || null,
        ocupacao: quarto.ocupacao ?? 0,
        status: quarto.status || 'Disponível',
      }),
    });
    const result = await handleResponse(response);
    return mapQuarto(result.data);
  } catch (error) {
    console.error('Erro ao atualizar quarto: ', error);
    throw error;
  }
};

const remove = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    const result = await handleResponse(response);
    return result.message;
  } catch (error) {
    console.error('Erro ao remover quarto: ', error);
    throw error;
  }
};

const quartoService = {
  getAll,
  getById,
  add,
  update,
  remove,
};

export default quartoService;
