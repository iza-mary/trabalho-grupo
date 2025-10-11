const DoacaoDinheiro = require("./doacaoDinheiro");
const DoacaoProduto = require("./doacaoProduto");
const Doador = require("./doador");

class Doacao {
    constructor(data) {
        this.id = data.id || null;
        this.data = data.data;
        this.tipo = data.tipo;
        this.obs = data.obs || null;
        this.doador = new Doador(data)
        this.idosoId = data.idoso_id || data.idosoId || (data.idoso && data.idoso.id) || null;
        this.idoso = data.idosoNome || (data.idoso && data.idoso.nome) || data.idoso || null;
        this.evento = data.evento || null;
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
            idosoId: this.idosoId,
            idoso: this.idoso,
            doador: this.doador.toJSON(),
            evento: this.evento,
            doacao: this.doacao.toJSON()
        }
    }
}
module.exports = Doacao