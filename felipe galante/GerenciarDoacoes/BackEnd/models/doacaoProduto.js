class DoacaoProduto {
    constructor(data) {
        this.item = data.item || data.doacao.item;
        this.qntd = data.qntd || data.doacao.qntd;
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
            item: this.item,
            qntd: this.qntd
        }
    }
}

module.exports = DoacaoProduto