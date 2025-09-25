class Doador {
    constructor(data) {
        this.doadorId = data.doador.doadorId || data.doador;
        this.nome = data.doador.nome || data.nome;
}

    //Validações
    validate() {
        const errors = [];
        if (!this.nome || this.nome.trim().length === 0) {
            errors.push("Nome é obrigatório!")
        }
        return errors;
    }

    toJSON() {
        return {
            doadorId: this.doadorId,
            nome: this.nome
        }
    }
}
module.exports = Doador