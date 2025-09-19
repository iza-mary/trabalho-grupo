class DoacaoProduto {
    constructor(data) {
        this.id = data.id || null;
        this.item = data.item || null;
        this.qntd = data.qntd || null;
    }

    validate() {
        const errors = [];

        if (this.quantidade <= 0) {
            errors.push("Quantidade inválida!");
        }
        
        return errors;
    }

    toJSON() {
        return {
            produtoId: this.id,
            item: this.item,
            quantidade: this.quantidade
        }
    }
}

module.exports = DoacaoProduto