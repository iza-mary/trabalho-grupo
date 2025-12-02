const DoacaoDinheiro = require("./doacaoDinheiro");
const DoacaoAlimentos = require("./doacaoAlimentos");
const DoacaoItens = require("./doacaoItens");
const Doador = require("./doador");

class Doacao {
    constructor(data) {
        this.id = data.id || null;
        this.data = data.data;
        this.tipo = data.tipo;
        this.obs = data.obs || null;
        // Quem está realizando a operação (opcional, vindo de req.user)
        this.actor = data.actor || null;
        // Aceita objeto aninhado { doador: { doadorId, nome, ... } } ou flat
        // Quando o SELECT inclui aliases doadorId/doadorNome, prioriza-os para montar o objeto doador
        const doadorPayload = (data?.doadorId !== undefined || data?.doadorNome !== undefined)
            ? { id: Number(data.doadorId ?? data.doador), doadorId: Number(data.doadorId ?? data.doador), nome: data.doadorNome ?? "" }
            : (data?.doador ?? data);
        this.doador = new Doador(doadorPayload);
        this.idosoId = data.idoso_id || data.idosoId || (data.idoso && data.idoso.id) || null;
        this.idoso = data.idosoNome || (data.idoso && data.idoso.nome) || data.idoso || null;
        // Suporte a relacionamento com eventos: id e título
        this.eventoId = data.evento_id || data.eventoId || null;
        this.eventoTitulo = data.eventoTitulo || data.evento || null;
        const tipoNorm = (t) => {
            const v = String(t || '').toUpperCase();
            if (v === 'D' || v === 'DINHEIRO') return 'DINHEIRO';
            if (v === 'A' || v === 'ALIMENTO') return 'ALIMENTO';
            if (v === 'O' || v === 'OUTROS' || v === 'OUTRO') return 'OUTROS';
            return v;
        };
        const tn = tipoNorm(this.tipo);
        if (tn === 'DINHEIRO') {
            this.doacao = new DoacaoDinheiro(data);
        } else if (tn === 'ALIMENTO') {
            this.doacao = new DoacaoAlimentos(data);
        } else {
            this.doacao = new DoacaoItens(data);
        }
    }

    //Validações
    validate() {
        const errors = [];

        if (!this.data || this.data.trim().length === 0) {
            errors.push("Data é obrigatória!")
        }
        if (!this.tipo || this.tipo.trim().length === 0) {
            errors.push("Tipo é obrigatório!")
        }
        if (!this.doador.doadorId || isNaN(this.doador.doadorId) || this.doador.doadorId <= 0) {
            errors.push("Doador é obrigatório e deve ser um número válido!")
        }

        const validTipo = ["D", "A", "O", "Dinheiro", "Alimento", "Outros"];

        if (!validTipo.includes(this.tipo)) {
            errors.push("Tipo de doação inválida!");
        }

        // Validações específicas do subtipo
        try {
            const subErrors = (this.doacao?.validate && typeof this.doacao.validate === 'function') ? this.doacao.validate() : [];
            if (Array.isArray(subErrors) && subErrors.length) {
                errors.push(...subErrors);
            }
        } catch (_) {}

        // Regras cruzadas
        const tipoUpper = String(this.tipo || '').toUpperCase();
        const isDinheiro = (tipoUpper === 'D' || tipoUpper === 'DINHEIRO');
        const isAlimento = (tipoUpper === 'A' || tipoUpper === 'ALIMENTO');
        const isOutros = (tipoUpper === 'O' || tipoUpper === 'OUTROS');
        if (isDinheiro) {
            const v = Number(this.doacao?.valor ?? 0);
            if (!v || v <= 0) errors.push('Valor de doação em dinheiro deve ser positivo');
        }
        if (isAlimento) {
            const q = Number(this.doacao?.quantidade ?? this.doacao?.qntd ?? 0);
            const t = String(this.doacao?.tipo_alimento || '').trim();
            if (!t) errors.push('Tipo de alimento é obrigatório');
            if (!q || q <= 0) errors.push('Quantidade de alimento deve ser positiva');
        }
        if (isOutros) {
            const q = Number(this.doacao?.quantidade ?? this.doacao?.qntd ?? 0);
            const d = String(this.doacao?.descricao_item || '').trim();
            if (!d) errors.push('Descrição do item é obrigatória');
            if (!q || q <= 0) errors.push('Quantidade de item deve ser positiva');
        }

        return errors;
    }

    toJSON() {
        return {
            id: this.id,
            data: this.data,
            tipo: this.tipo,
            obs: this.obs,
            actor: this.actor,
            idosoId: this.idosoId,
            idoso: this.idoso,
            doador: this.doador.toJSON(),
            eventoId: this.eventoId,
            evento: this.eventoTitulo,
            doacao: this.doacao.toJSON()
        }
    }
}
module.exports = Doacao
/*
  Modelo Doação
  - Estrutura comum de doações e campos compartilhados.
*/
