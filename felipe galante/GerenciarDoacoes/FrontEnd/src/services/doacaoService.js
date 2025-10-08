const BASE_API_URL = "http://localhost:3000/api/doacoes"

const handleResponse = async (response) => {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json();
    if (!data.success) {
        throw new Error(data.message || "Erro na requisição");
    }
    return data;
}

const getAll = async () => {
    try {
        const response = await fetch(BASE_API_URL);
        const result = await handleResponse(response);
        return result.data.map(doacao => ({ ...doacao }));
    } catch (error) {
        console.error(`Erro ao buscar doações ${error}`);
        throw error;
    }
}

const getByFiltred = async (filtro) => {
    try {
        const response = await fetch(`${BASE_API_URL}/filtrar`, {
            method: "POST",
            headers: {
                "Content-Type" : "application/json",
            },
            body: JSON.stringify(filtro)
        })
        const result = await handleResponse(response)
        return result.data
    } catch (error) {
        console.error(`Erro ao buscar doações ${error}`)
    }
}

const getById = async (id) => {
    try {
        const response = await fetch(`${BASE_API_URL}/${id}`);
        const result = await handleResponse(response);
        return { ...result.data }
    } catch (error) {
        console.error(`Erro ao buscar doacao ${id}: `, error);
        throw error
    }
}

const add = async (doacao) => {
    try {
        const doacaoData = {
            ...doacao
        }
        const response = await fetch(BASE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(doacaoData)
        })
        const result = await handleResponse(response);

        return {
            ...result.data
        }
    } catch (error) {
        console.error('Erro ao cadastrar doação', error);
        throw error;
    }

}

const update = async (doacao) => {
    try {
        const response = await fetch(`${BASE_API_URL}/${doacao.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(doacao)
        })

        const result = await handleResponse(response);
        return { ...result.data };
    } catch (error) {
        console.error(`Erro ao atualizar doação ${doacao.id}: `, error);
        throw error;
    }
}

const remove = async (id) => {
    try {
        const response = await fetch(`${BASE_API_URL}/${id}`, {
            method: "DELETE"
        })

        const result = await handleResponse(response);
        return result.message
    } catch (error) {
        console.error(`Erro ao remover doação ${id}:`, error)
    }
}

const getDoadorByName = async (nome) => {
    try {
        const response = await fetch(`http://localhost:3000/api/doadores/nome`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ nome })
        })
        const result = await handleResponse(response)
        return result.data
    } catch (error) {
        console.error(`Erro ao buscar doador: ${error}`)
    }
}

const doacoesService = {
    getAll,
    getById,
    update,
    add,
    remove,
    getByFiltred,
    getDoadorByName
}

export default doacoesService;