export const validarInternacao = (formData, quartos) => {
    const erros = {};
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Validação do idoso
    if (!formData.idoso_id) {
        erros.idoso_id = 'Idoso é obrigatório';
    }

    // Validação do quarto
    if (!formData.quarto_id) {
        erros.quarto_id = 'Quarto é obrigatório';
    } else {
        const quartoSelecionado = quartos.find(q => q.id === parseInt(formData.quarto_id));
        if (!quartoSelecionado) {
            erros.quarto_id = 'Quarto inválido';
        }
    }

    // Validação da cama
    if (!formData.cama || !formData.cama.trim()) {
        erros.cama = 'Cama é obrigatória';
    }

    // Validação da data de entrada
    if (!formData.data_entrada) {
        erros.data_entrada = 'Data de entrada é obrigatória';
    } else {
        const dataEntrada = new Date(formData.data_entrada);
        if (dataEntrada > hoje) {
            erros.data_entrada = 'Data de entrada não pode ser no futuro';
        }
    }

    return erros;
};

export const validarBaixa = (formData) => {
    const erros = {};
    
    if (!formData.motivo_saida || !formData.motivo_saida.trim()) {
        erros.motivo_saida = 'Motivo da baixa é obrigatório';
    }

    return erros;
};