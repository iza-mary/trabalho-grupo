class DoacaoDinheiro {
    constructor(data) {
        this.valor = (data?.valor ?? data?.doacao?.valor ?? null);
    }

    toJSON() {
        return {
            valor: this.valor
        }
    }
}
module.exports = DoacaoDinheiro