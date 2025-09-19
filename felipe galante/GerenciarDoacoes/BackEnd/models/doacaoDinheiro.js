class DoacaoDinheiro {
    constructor(data) {
        this.id = data.id || null;
        this.valor = data.valor || null;
    }

    toJSON() {
        return {
            dinheiroId: this.id,
            valor: this.valor
        }
    }
}
module.exports = DoacaoDinheiro