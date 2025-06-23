const API_BASE_URL = 'http://localhost:3000/api/idosos';

const handleResponse = async (response) => {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (!data.success) {
        throw new Error(data.message || 'Erro de requisição');
    }
    return data;
};

const getAll = async () => {
    try {
        const response = await fetch(API_BASE_URL);
        const result = await handleResponse(response);
        return result.data || [];
    } catch (error) {
        console.error('Erro detalhado:', {
            message: error.message,
            endpoint: API_BASE_URL,
            stack: error.stack
        });
        throw new Error('Serviço indisponível. Tente novamente mais tarde.');
    }
};

const getById = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        const result = await handleResponse(response);
        
        console.log('Dados recebidos da API:', result.data);
        
        return {
            ...result.data,
            rua: result.data.rua || '',
            numero: result.data.numero || '',
            complemento: result.data.complemento || '',
            cidade: result.data.cidade || '',
            cep: result.data.cep || '',
            estado: result.data.estado || 'São Paulo'
        };
    } catch (error) {
        console.error(`Erro ao buscar idoso ${id}:`, error);
        throw error;
    }
};

const add = async (idoso) => {
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(idoso),
        });
        const result = await handleResponse(response);
        
        return {
            ...result.data
        };
    } catch (error) {
        console.error('Erro ao adicionar idoso', error);
        throw error;
    }
};

const update = async (id, idoso) => {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...idoso,
                id: parseInt(id)
            }),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao atualizar');
        }
        
        return await response.json();
    } catch (error) {
        console.error("Erro no service:", { 
            message: error.message,
            payload: idoso 
        });
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
        console.error(`Erro ao excluir idoso ${id}:`, error);
        throw error;
    }
};

const idosoService = {
    getAll,
    getById,
    update,
    add,
    remove
};

export default idosoService;