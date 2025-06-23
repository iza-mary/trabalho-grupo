// Arquivo: idoso.js
// Descrição: Modelo que representa um idoso no sistema

class Idoso {
  constructor(data) {
    // Aplica valores padrão para dados vindo do banco de dados
    if (data.id) {
      this.applyDatabaseDefaults(data);
    }

    // Inicializa propriedades com valores recebidos ou padrão
    this.id = data.id;
    this.nome = data.nome || 'Nome não informado';
    this.dataNascimento = this.parseDate(data.dataNascimento) || new Date('1960-01-01');
    this.genero = ['Masculino', 'Feminino', 'Outro'].includes(data.genero) ? data.genero : 'Outro';
    this.rg = data.rg || '00000000';
    this.cpf = data.cpf || '000.000.000-00';
    this.cartaoSus = data.cartaoSus || '000000000000000';
    this.telefone = data.telefone || '(00) 0000-0000';
    this.rua = data.rua || 'Endereço não informado';
    this.numero = data.numero || '0';
    this.complemento = data.complemento || null;
    this.cidade = data.cidade || 'Cidade não informada';
    this.estadoId = data.estadoId || 1;
    this.estado = data.estado || 'SP'; // Adicionado para mapeamento
    this.cep = data.cep || '00000-000';
    this.status = ['internado', 'nao_internado'].includes(data.status) ? data.status : 'nao_internado';
    this.dataEntrada = this.parseDate(data.dataEntrada);
    this.quarto = data.quarto || null;
    this.cama = data.cama || null;
    this.observacoes = data.observacoes || null;
    this.dataCadastro = this.parseDate(data.dataCadastro);
    this.dataAtualizacao = this.parseDate(data.dataAtualizacao);
  }

  // Valida os dados do idoso
  validate() {
    const errors = [];
    
    // Validação do nome
    if (!this.nome || this.nome.trim().length < 3) {
        errors.push('Nome deve ter pelo menos 3 caracteres');
    }

    // Validação da data de nascimento
    if (!this.dataNascimento || isNaN(this.dataNascimento.getTime())) {
        errors.push('Data de nascimento inválida');
    } else {
        const hoje = new Date();
        if (this.dataNascimento > hoje) {
            errors.push('Data de nascimento não pode ser no futuro');
        }
    }

    // Validação do CPF
    if (!this.cpf || !this.validarCPF(this.cpf)) {
        errors.push('CPF inválido');
    }

    // Validação do telefone
    if (!this.telefone || !this.telefone.match(/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/)) {
        errors.push('Telefone inválido');
    }

    // Validação do CEP
    if (!this.cep || !this.cep.match(/^\d{5}-?\d{3}$/)) {
        errors.push('CEP inválido');
    }

    return errors;
  }

  // Valida o formato do CPF
  validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');
    return cpf.length === 11 || (cpf.length === 14 && cpf.includes('.') && cpf.includes('-'));
  }

  // Converte string para objeto Date
  parseDate(dateValue) {
    if (!dateValue) return null;
    if (dateValue instanceof Date) return dateValue;
    const parsedDate = new Date(dateValue);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  // Aplica valores padrão para campos do banco de dados
  applyDatabaseDefaults(data) {
    const defaults = {
      nome: 'Nome não informado',
      dataNascimento: '1960-01-01',
      genero: 'Outro',
      rg: '00000000',
      cpf: '000.000.000-00',
      cartaoSus: '000000000000000',
      telefone: '(00) 0000-0000',
      rua: 'Endereço não informado',
      numero: '0',
      cidade: 'Cidade não informada',
      estadoId: 1,
      estado: 'SP',
      cep: '00000-000',
      status: 'nao_internado'
    };

    Object.keys(defaults).forEach(key => {
      if (!data[key]) data[key] = defaults[key];
    });
  }

  // Calcula a idade com base na data de nascimento
  calcularIdade() {
    const hoje = new Date();
    let idade = hoje.getFullYear() - this.dataNascimento.getFullYear();
    const mes = hoje.getMonth() - this.dataNascimento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoje.getDate() < this.dataNascimento.getDate())) {
      idade--;
    }
    
    return idade;
  }

  // Retorna o endereço completo formatado
  getEnderecoCompleto() {
    let endereco = `${this.rua}, ${this.numero}`;
    if (this.complemento) {
      endereco += ` - ${this.complemento}`;
    }
    endereco += ` - ${this.cidade}`;
    return endereco;
  }

  // Verifica se o idoso está internado
  estaInternado() {
    return this.status === 'internado';
  }

  // Converte o objeto para JSON (usado nas respostas da API)
  toJSON() {
    return {
        id: this.id,
        nome: this.nome,
        dataNascimento: this.dataNascimento ? this.dataNascimento.toISOString().split('T')[0] : null,
        genero: this.genero,
        rg: this.rg,
        cpf: this.cpf,
        cartaoSus: this.cartaoSus,
        telefone: this.telefone,
        rua: this.rua,
        numero: this.numero,
        complemento: this.complemento,
        cidade: this.cidade,
        estado: this.estado,
        cep: this.cep,
        status: this.status,
        dataEntrada: this.dataEntrada ? this.dataEntrada.toISOString().split('T')[0] : null,
        quarto: this.quarto,
        cama: this.cama,
        observacoes: this.observacoes
    };
  }
}

module.exports = Idoso;