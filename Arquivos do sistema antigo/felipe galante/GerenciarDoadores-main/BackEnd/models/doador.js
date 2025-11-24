// Modelo de dados do Doador: guarda campos e valida entradas obrigatórias
class Doador {
    constructor(data) {
            this.id = data.id || null,
            this.nome = data.nome,
            this.cpf = data.cpf,
            this.telefone = data.telefone,
            this.rg = data.rg || "",
            this.email = data.email || "",
            this.cidade = data.cidade || "",
            this.rua = data.rua || "",
            this.numero = data.numero || "",
            this.cep = data.cep || "",
            this.complemento = data.complemento || ""
    }

    // Verifica campos obrigatórios e retorna mensagens de erro
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


    // Organiza os dados para serem enviados na resposta
    toJSON() {
        return {
            id: this.id,
            nome: this.nome,
            cpf: this.cpf,
            telefone: this.telefone,
            rg: this.rg,
            email: this.email,
            cidade: this.cidade,
            rua: this.rua,
            numero: this.numero,
            cep: this.cep,
            complemento: this.complemento
        }
    }
}

module.exports = Doador;