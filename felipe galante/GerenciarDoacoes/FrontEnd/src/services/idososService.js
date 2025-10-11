const BASE_API_URL_IDOSOS = "http://localhost:3000/api/idosos";

const handleResponse = async (response) => {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || "Erro na requisição");
  }
  return data;
};

export const getAllIdosos = async () => {
  try {
    const response = await fetch(BASE_API_URL_IDOSOS);
    const result = await handleResponse(response);
    return result.data || [];
  } catch (error) {
    console.error(`Erro ao buscar idosos: ${error}`);
    return [];
  }
};

export const searchIdososByNome = async (nome) => {
  try {
    const idosos = await getAllIdosos();
    const termo = (nome || "").toLowerCase();
    return idosos.filter((i) => i.nome?.toLowerCase().includes(termo));
  } catch (error) {
    console.error(`Erro ao filtrar idosos: ${error}`);
    return [];
  }
};

export default {
  getAllIdosos,
  searchIdososByNome,
};