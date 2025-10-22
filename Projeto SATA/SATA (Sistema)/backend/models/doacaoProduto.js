class DoacaoProduto {
    constructor(data) {
        this.item = (data?.item ?? data?.doacao?.item ?? null);
        this.qntd = (data?.qntd ?? data?.doacao?.qntd ?? null);
        this.unidade_medida = (data?.unidade_medida ?? data?.doacao?.unidade_medida ?? 'Unidade');
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
            qntd: this.qntd,
            unidade_medida: this.unidade_medida
        }
    }
}

module.exports = DoacaoProduto