import api from './api';

const resource = '/idosos';

const getAll = async () => {
    try {
        const { data } = await api.get(resource);
        if (!data?.success) throw new Error(data?.message || 'Erro de requisição');
        return data.data || [];
    } catch (error) {
        console.error('Erro detalhado:', {
            message: error.message,
            endpoint: resource,
            status: error?.response?.status
        });
        if (error?.response?.status === 401) {
            throw new Error('Não autenticado. Faça login novamente.');
        }
        throw new Error('Serviço indisponível. Tente novamente mais tarde.');
    }
};

const getById = async (id) => {
    try {
        const { data } = await api.get(`${resource}/${id}`);
        if (!data?.success) throw new Error(data?.message || 'Erro de requisição');
        const result = data;

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

const getFicha = async (id) => {
    try {
        const { data } = await api.get(`${resource}/${id}/ficha`);
        if (!data?.success) throw new Error(data?.message || 'Erro de requisição');
        return data.data;
    } catch (error) {
        console.error(`Erro ao buscar ficha completa do idoso ${id}:`, error);
        throw error;
    }
};

const add = async (idoso) => {
    try {
        const { data } = await api.post(resource, idoso);
        if (!data?.success) throw new Error(data?.message || 'Erro ao adicionar');
        return { ...data.data };
    } catch (error) {
        console.error('Erro ao adicionar idoso', error);
        throw error;
    }
};

const update = async (id, idoso) => {
    try {
        const { data } = await api.put(`${resource}/${id}`, {
            ...idoso,
            id: parseInt(id)
        });
        if (!data?.success) throw new Error(data?.message || 'Erro ao atualizar');
        return data;
    } catch (error) {
        console.error('Erro no service:', {
            message: error.message,
            payload: idoso
        });
        throw error;
    }
};

const remove = async (id) => {
    try {
        const { data } = await api.delete(`${resource}/${id}`);
        if (!data?.success) throw new Error(data?.message || 'Erro ao excluir');
        return data?.message || 'Excluído com sucesso';
    } catch (error) {
        console.error(`Erro ao excluir idoso ${id}:`, error);
        throw error;
    }
};

const updateStatus = async (id, status) => {
    try {
        const { data } = await api.put(`${resource}/${id}/status`, { status });
        if (!data?.success) throw new Error(data?.message || 'Erro ao atualizar status');
        return data;
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        throw error;
    }
};

const idosoService = {
    getAll,
    getById,
    getFicha,
    update,
    add,
    remove,
    updateStatus
};

export default idosoService;
/*
  Serviço de Idosos
  - CRUD e consultas de residentes.
*/