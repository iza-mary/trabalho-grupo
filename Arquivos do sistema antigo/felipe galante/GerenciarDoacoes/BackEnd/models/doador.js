class Doador {
    constructor(data) {
        const doadorObj = (data && typeof data.doador === 'object') ? data.doador : null;
        this.doadorId = (doadorObj?.doadorId ?? data?.doador ?? null);
        this.nome = (doadorObj?.nome ?? data?.nome ?? null);
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