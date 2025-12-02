import api from './api';

const resource = '/idosos';

const csrfHeader = () => {
    const t = typeof localStorage !== 'undefined' ? localStorage.getItem('csrfToken') : null;
    return t ? { 'x-csrf-token': t } : {};
};

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
        const msg = error?.response?.data?.message || error?.response?.data?.error || error.message || 'Erro ao adicionar idoso';
        console.error('Erro ao adicionar idoso', msg);
        throw new Error(msg);
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
        const msg = error?.response?.data?.message || error?.response?.data?.error || error.message || 'Erro ao atualizar';
        console.error('Erro no service:', { message: msg, payload: idoso });
        throw new Error(msg);
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

const addObservacao = async (id, observacaoData) => {
    try {
        const { data } = await api.post(`${resource}/${id}/observacoes`, observacaoData, { headers: csrfHeader() });
        if (!data?.success) throw new Error(data?.message || 'Erro ao salvar observação');
        return data.data;
    } catch (error) {
        const msg = error?.response?.data?.message || error?.response?.data?.error || error.message || 'Erro ao salvar observação';
        console.error('Erro ao salvar observação:', msg);
        throw new Error(msg);
    }
};

const getObservacoes = async (id) => {
    try {
        const { data } = await api.get(`${resource}/${id}/observacoes`);
        if (!data?.success) throw new Error(data?.message || 'Erro ao buscar observações');
        return Array.isArray(data.data) ? data.data : [];
    } catch (error) {
        const msg = error?.response?.data?.message || error?.response?.data?.error || error.message || 'Erro ao buscar observações';
        console.error('Erro ao buscar observações:', msg);
        throw new Error(msg);
    }
};

const updateObservacao = async (id, obsId, payload) => {
    try {
        const { data } = await api.put(`${resource}/${id}/observacoes/${obsId}`, payload, { headers: csrfHeader() });
        if (!data?.success) throw new Error(data?.message || 'Erro ao atualizar observação');
        return data.data;
    } catch (error) {
        const msg = error?.response?.data?.message || error?.response?.data?.error || error.message || 'Erro ao atualizar observação';
        console.error('Erro ao atualizar observação:', msg);
        throw new Error(msg);
    }
};

const deleteObservacao = async (id, obsId) => {
    console.log(`Enviando requisição DELETE para ${resource}/${id}/observacoes/${obsId}`);
    try {
        const { data } = await api.delete(`${resource}/${id}/observacoes/${obsId}`, { headers: csrfHeader() });
        console.log('Resposta da API:', data);
        if (!data?.success) throw new Error(data?.message || 'Erro ao excluir observação');
        return true;
    } catch (error) {
        const msg = error?.response?.data?.message || error?.response?.data?.error || error.message || 'Erro ao excluir observação';
        console.error('Erro ao excluir observação:', msg, error.response);
        throw new Error(msg);
    }
};

const idosoService = {
    getAll,
    getById,
    getFicha,
    update,
    add,
    remove,
    updateStatus,
    addObservacao,
    getObservacoes,
    updateObservacao,
    deleteObservacao
};

export default idosoService;
/*
  Serviço de Idosos
  - CRUD e consultas de residentes.
*/
