class Doador {
    constructor(data) {
        // Suporta payloads vindos de Doacao com { doadorId, nome } ou número simples (id do doador)
        if (data === null || data === undefined) {
            this.id = null;
            this.doadorId = null;
            this.nome = "";
            this.cpf = "";
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
            return;
        }

        // Se vier como número (ex.: campo 'doador' das doações), usa como id
        if (typeof data === 'number' || (typeof data === 'string' && /^\d+$/.test(data))) {
            const idNum = Number(data);
            this.id = idNum;
            this.doadorId = idNum;
            this.nome = "";
            this.cpf = "";
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
            return;
        }

        // Caso padrão: objeto completo do doador
        this.id = data.id || null;
        this.doadorId = data.doadorId || data.id || null;
        this.nome = data.nome;
        this.cpf = data.cpf;
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
    }

    validate() {
        const errors = []

        if (!this.nome || !this.nome.trim().length === 0) {
            errors.push("Nome é obrigatório");
        }
        if (!this.cpf || this.cpf.trim().length === 0) {
            errors.push("CPF é obrigatório!")
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
            telefone: this.telefone,
            rg: this.rg,
            email: this.email,
            cidade: this.cidade,
            rua: this.rua,
            numero: this.numero,
            cep: this.cep,
            complemento: this.complemento,
            data_cadastro: this.data_cadastro,
            data_atualizacao: this.data_atualizacao
        }
    }
}

module.exports = Doador;