class DoacaoDinheiro {
    constructor(data) {
        this.valor = (data?.valor ?? data?.doacao?.valor ?? null);
        this.forma_pagamento = (data?.forma_pagamento ?? data?.doacao?.forma_pagamento ?? 'Dinheiro');
        this.comprovante = (data?.comprovante ?? data?.doacao?.comprovante ?? null);
    }

    toJSON() {
        return {
            valor: this.valor,
            forma_pagamento: this.forma_pagamento,
            comprovante: this.comprovante
        }
    }
}
module.exports = DoacaoDinheiro
/*
  Modelo Doação em Dinheiro
  - Valores monetários e finalidade.
*/
