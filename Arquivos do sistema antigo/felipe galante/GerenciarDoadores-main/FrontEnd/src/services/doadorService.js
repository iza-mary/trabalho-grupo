const BASE_API_URL = "http://localhost:3000/api/doadores"

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

const getById = async (id) => {
    try {
        const response = await fetch(`${BASE_API_URL}/${id}`)
        const result = await handleResponse(response);
        return result.data;
    } catch (error) {
        console.error(`Erro ao buscar doador ${id}: ${error}`);
    }
}

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

const remove = async (id) => {
    try {
        const response = await fetch(`${BASE_API_URL}/${id}`, {
            method: "DELETE",
        })
        const result = handleResponse(response);
        return result.message;
    } catch (error) {
        console.error(`Erro ao remover doador ${id}:`, error)
        throw error;
    }
}

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