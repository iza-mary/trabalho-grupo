const DoacaoDinheiro = require("./doacaoDinheiro");
const DoacaoProduto = require("./doacaoProduto");
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
        this.doacao = this.tipo === "D" ? new DoacaoDinheiro(data) : new DoacaoProduto(data);
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

        const validTipo = ["D", "A", "O"];

        if (!validTipo.includes(this.tipo)) {
            errors.push("Tipo de doação inválida!");
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