import api from './api';

export const quartoService = {
    getAll: async () => {
        const response = await api.get('/quartos');
        return response.data;
    },
    
    getById: async (id) => {
        const response = await api.get(`/quartos/${id}`);
        return response.data;
    },
    
    create: async (quarto) => {
        const response = await api.post('/quartos', quarto);
        return response.data;
    },
    
    update: async (id, quarto) => {
        const response = await api.put(`/quartos/${id}`, quarto);
        return response.data;
    },
    
    delete: async (id) => {
        const response = await api.delete(`/quartos/${id}`);
        return response.data;
    },
    
    getDisponiveis: async () => {
        const response = await api.get('/quartos/disponiveis');
        return response.data;
    }
};

export const internacaoService = {
    getAll: async () => {
        const response = await api.get('/internacoes');
        return response.data;
    },
    
    getAtivas: async () => {
        const response = await api.get('/internacoes/ativas');
        return response.data;
    },
    
    getById: async (id) => {
        const response = await api.get(`/internacoes/${id}`);
        return response.data;
    },
    
    create: async (internacao) => {
        const response = await api.post('/internacoes', internacao);
        return response.data;
    },
    
    update: async (id, internacao) => {
        const response = await api.put(`/internacoes/${id}`, internacao);
        return response.data;
    },
    
    delete: async (id) => {
        const response = await api.delete(`/internacoes/${id}`);
        return response.data;
    },
    
    getCamasDisponiveis: async (quartoId) => {
        const response = await api.get(`/internacoes/quartos/${quartoId}/camas`);
        return response.data;
    },
    
    darBaixa: async (id, data_saida, motivo_saida, observacoes = '') => {
        const response = await api.put(`/internacoes/${id}/baixa`, { 
            data_saida, 
            motivo_saida,
            observacoes
        });
        return response.data;
    },
    
    getByUsuarioId: async (usuarioId) => {
        const response = await api.get(`/internacoes/idoso/${usuarioId}`);
        return response.data;
    },
    
    getInternacoesPorQuarto: async (quartoId) => {
        const response = await api.get(`/internacoes/quarto/${quartoId}`);
        return response.data;
    },
    
    getInternacoesPorStatus: async (status) => {
        const response = await api.get(`/internacoes/status/${status}`);
        return response.data;
    }
};

export default { quartoService, internacaoService };