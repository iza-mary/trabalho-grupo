class DoacaoProduto {
    constructor(data) {
        this.item = (data?.item ?? data?.doacao?.item ?? null);
        this.qntd = (data?.qntd ?? data?.doacao?.qntd ?? null);
    }

    validate() {
        const errors = [];

        if (!this.qntd || Number(this.qntd) <= 0) {
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