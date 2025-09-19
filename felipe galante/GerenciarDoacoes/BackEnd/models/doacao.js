const DoacaoDinheiro = require("./doacaoDinheiro");
const DoacaoProduto = require("./doacaoProduto");

class Doacao {
    constructor(data) {
        this.id = data.id || null;
        this.data = data.data;
        this.tipo = data.tipo;
        this.obs = data.obs || null;
        this.doador = data.doador || null;
        this.idoso = data.idoso || null;
        this.evento = data.evento || null;
        this.doacao = this.tipo === "D" ? new DoacaoDinheiro(data) : new DoacaoProduto(data);
    }

    //Validações
    validate() {
        const errors = [];

        if (!this.data || this.data.trim().length === 0) {
            errors.push("Data é obrigatória!")
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
            idoso: this.idoso,
            doador: this.doador,
            evento: this.evento,
            doacao: this.doacao.toJSON()
        }
    }
}
module.exports = Doacao