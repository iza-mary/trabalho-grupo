class Doador {
    constructor(data) {
        // Suporta payloads vindos de Doacao com { doadorId, nome } ou número simples (id do doador)
        if (data === null || data === undefined) {
            this.id = null;
            this.doadorId = null;
            this.nome = "";
            this.cpf = "";
            this.cnpj = "";
            this.telefone = "";
            this.rg = "";
            this.email = "";
            this.cidade = "";
            this.rua = "";
            this.numero = "";
            this.cep = "";
            this.complemento = "";
            this.data_cadastro = null;
            this.data_atualizacao = null;
            this.representante = "";
            return;
        }

        // Se vier como número (ex.: campo 'doador' das doações), usa como id
        if (typeof data === 'number' || (typeof data === 'string' && /^\d+$/.test(data))) {
            const idNum = Number(data);
            this.id = idNum;
            this.doadorId = idNum;
            this.nome = "";
            this.cpf = "";
            this.cnpj = "";
            this.telefone = "";
            this.rg = "";
            this.email = "";
            this.cidade = "";
            this.rua = "";
            this.numero = "";
            this.cep = "";
            this.complemento = "";
            this.data_cadastro = null;
            this.data_atualizacao = null;
            this.representante = "";
            return;
        }

        // Caso padrão: objeto completo do doador
        this.id = data.id || null;
        this.doadorId = data.doadorId || data.id || null;
        this.nome = data.nome;
        this.cpf = data.cpf;
        this.cnpj = data.cnpj || null;
        this.telefone = data.telefone;
        this.rg = data.rg || "";
        this.email = data.email || "";
        this.cidade = data.cidade || "";
        this.rua = data.rua || "";
        this.numero = data.numero || "";
        this.cep = data.cep || "";
        this.complemento = data.complemento || "";
        this.data_cadastro = data.data_cadastro || data.dataCadastro || null;
        this.data_atualizacao = data.data_atualizacao || data.dataAtualizacao || null;
        this.representante = data.representante || data.representanteLegal || "";
    }

    validate() {
        const errors = []

        if (!this.nome || !this.nome.trim().length === 0) {
            errors.push("Nome é obrigatório");
        }
        // Exigir pelo menos um documento: CPF (PF) ou CNPJ (PJ)
        const hasCPF = !!(this.cpf && String(this.cpf).trim().length > 0);
        const hasCNPJ = !!(this.cnpj && String(this.cnpj).trim().length > 0);
        if (!hasCPF && !hasCNPJ) {
            errors.push("CPF ou CNPJ é obrigatório!");
        }
        if (!this.telefone || this.telefone.trim().length === 0) {
            errors.push("Telefone é obrigatório!");
        }
        return errors;
    }


    toJSON() {
        return {
            id: this.id,
            doadorId: this.doadorId || this.id,
            nome: this.nome,
            cpf: this.cpf,
            cnpj: this.cnpj,
            telefone: this.telefone,
            rg: this.rg,
            email: this.email,
            cidade: this.cidade,
            rua: this.rua,
            numero: this.numero,
            cep: this.cep,
            complemento: this.complemento,
            data_cadastro: this.data_cadastro,
            data_atualizacao: this.data_atualizacao,
            representante: this.representante
        }
    }
}

module.exports = Doador;
/*
  Modelo Doador
  - Representa doadores com dados de contato e histórico.
*/