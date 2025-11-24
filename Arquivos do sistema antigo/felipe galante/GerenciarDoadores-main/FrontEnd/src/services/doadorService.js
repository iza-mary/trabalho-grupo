// Endereço base da API do backend para operações de doadores
const BASE_API_URL = "http://localhost:3000/api/doadores"

// Padroniza a leitura e checagem das respostas da API
const handleResponse = async (response) => {
    if (!response.ok) {
        throw new Error("HTTP error! status:", response.status)
    }
    const data = await response.json();
    if (!data.success) {
        throw new Error(data.message || "Erro na requisição");
    }
    return data
}

// Lista todos os doadores
const getAll = async () => {
    try {
        const response = await fetch(BASE_API_URL);
        const result = await handleResponse(response)
        return result.data.map(doadr => ({ ...doadr }))
    } catch (error) {
        console.error("Erro ao buscar doador:", error);
        throw error;
    }
}

// Busca um doador específico pelo id
const getById = async (id) => {
    try {
        const response = await fetch(`${BASE_API_URL}/${id}`)
        const result = await handleResponse(response);
        return result.data;
    } catch (error) {
        console.error(`Erro ao buscar doador ${id}: ${error}`);
    }
}

// Cria um novo doador
const add = async (doador) => {
    try {
        const doadorData = {
            ...doador
        }
        const response = await fetch(BASE_API_URL, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(doadorData),
        })
        const result = await handleResponse(response);
        return { ...result.data }
    } catch (error) {
        console.error("Erro ao adicionar doador:", error);
        throw error;
    }
}

// Atualiza um doador existente
const update = async (doador) => {
    try {
        const doadorData = { ...doador }
        const response = await fetch(`${BASE_API_URL}/${doador.id}`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(doadorData),
        })
        const result = await handleResponse(response)
        return { ...result.data }
    } catch (error) {
        console.error(`Erro ao atualizar doador ${doador}: ${error}`);
    }
}

// Remove um doador pelo id
const remove = async (id) => {
    try {
        const response = await fetch(`${BASE_API_URL}/${id}`, {
            method: "DELETE",
        })
        const result = await handleResponse(response);
        return result.message;
    } catch (error) {
        console.error(`Erro ao remover doador ${id}:`, error)
        throw error;
    }
}

// Filtra doadores usando termos variados
const getByBusca = async (filtros) => {
    try {
        const response = await fetch(`${BASE_API_URL}/filtrar`, {
            method: "POST",
            headers: {
                "Content-Type" : "application/json"
            },
            body: JSON.stringify(filtros),
        })
        const result = await handleResponse(response)
        return result.data;
    } catch (error) {
        console.error("Erro ao filtrar doadores:", error)
        throw error;
    }
}

const doadorService = {
    getAll,
    getById,
    add,
    update,
    remove,
    getByBusca
}

export default doadorService