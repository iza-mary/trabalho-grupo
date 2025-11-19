class Notificacao {
  constructor(data = {}) {
    this.id = data.id || null;
    this.tipo = data.tipo || null; // 'cadastro', 'estoque_baixo', 'transacao_financeira', 'evento_proximo'
    this.titulo = (data.titulo || '').trim();
    this.descricao = (data.descricao || '').trim();
    this.prioridade = data.prioridade || 'normal'; // 'baixa', 'normal', 'alta', 'critica'
    this.lida = data.lida != null ? Boolean(data.lida) : false;
    this.usuario_id = data.usuario_id || null;
    this.referencia_id = data.referencia_id || null; // ID do registro relacionado (produto, evento, etc.)
    this.referencia_tipo = data.referencia_tipo || null; // 'produto', 'evento', 'doacao', 'financeiro'
    this.data_criacao = data.data_criacao || null;
    this.data_leitura = data.data_leitura || null;
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
  }

  validate() {
    const errors = [];
    const tiposValidos = ['cadastro', 'estoque_baixo', 'transacao_financeira', 'evento_proximo'];
    const prioridadesValidas = ['baixa', 'normal', 'alta', 'critica'];
    const referenciasValidas = ['produto', 'evento', 'doacao', 'financeiro', 'idoso', 'doador', 'quarto'];

    if (!this.tipo || !tiposValidos.includes(this.tipo)) {
      errors.push('tipo deve ser um dos valores: ' + tiposValidos.join(', '));
    }

    if (!this.titulo) {
      errors.push('titulo é obrigatório');
    }

    if (!this.descricao) {
      errors.push('descricao é obrigatória');
    }

    if (!this.prioridade || !prioridadesValidas.includes(this.prioridade)) {
      errors.push('prioridade deve ser um dos valores: ' + prioridadesValidas.join(', '));
    }

    if (this.referencia_tipo && !referenciasValidas.includes(this.referencia_tipo)) {
      errors.push('referencia_tipo deve ser um dos valores: ' + referenciasValidas.join(', '));
    }

    return errors;
  }

  toJSON() {
    return {
      id: this.id,
      tipo: this.tipo,
      titulo: this.titulo,
      descricao: this.descricao,
      prioridade: this.prioridade,
      lida: this.lida,
      usuario_id: this.usuario_id,
      referencia_id: this.referencia_id,
      referencia_tipo: this.referencia_tipo,
      data_criacao: this.data_criacao,
      data_leitura: this.data_leitura,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Método estático para criar notificações específicas
  static criarNotificacaoCadastro(tipo_cadastro, nome_item, usuario_id = null) {
    return new Notificacao({
      tipo: 'cadastro',
      titulo: `Novo ${tipo_cadastro} cadastrado`,
      descricao: `${nome_item} foi cadastrado com sucesso no sistema`,
      prioridade: 'normal',
      usuario_id: usuario_id,
      referencia_tipo: tipo_cadastro.toLowerCase()
    });
  }

  static criarNotificacaoEstoqueBaixo(produto, usuario_id = null) {
    const prioridade = produto.estoque_atual === 0 ? 'critica' : 'alta';
    return new Notificacao({
      tipo: 'estoque_baixo',
      titulo: 'Estoque baixo',
      descricao: `${produto.nome} está com estoque ${produto.estoque_atual === 0 ? 'zerado' : 'abaixo do mínimo'} (${produto.estoque_atual}/${produto.estoque_minimo})`,
      prioridade: prioridade,
      usuario_id: usuario_id,
      referencia_id: produto.id,
      referencia_tipo: 'produto'
    });
  }

  static criarNotificacaoTransacaoFinanceira(transacao, usuario_id = null) {
    const tipo_transacao = transacao.tipo || (transacao.valor > 0 ? 'entrada' : 'saída');
    return new Notificacao({
      tipo: 'transacao_financeira',
      titulo: `Nova ${tipo_transacao} financeira`,
      descricao: `${tipo_transacao === 'entrada' ? 'Entrada' : 'Saída'} de R$ ${Math.abs(transacao.valor).toFixed(2)} - ${transacao.descricao || 'Sem descrição'}`,
      prioridade: 'normal',
      usuario_id: usuario_id,
      referencia_id: transacao.id,
      referencia_tipo: 'financeiro'
    });
  }

  static criarNotificacaoEventoProximo(evento, dias_restantes, usuario_id = null) {
    const prioridade = dias_restantes <= 1 ? 'alta' : dias_restantes <= 3 ? 'normal' : 'baixa';
    return new Notificacao({
      tipo: 'evento_proximo',
      titulo: 'Evento se aproximando',
      descricao: `${evento.nome} acontecerá em ${dias_restantes} ${dias_restantes === 1 ? 'dia' : 'dias'}`,
      prioridade: prioridade,
      usuario_id: usuario_id,
      referencia_id: evento.id,
      referencia_tipo: 'evento'
    });
  }
}

module.exports = Notificacao;
/*
  Modelo Notificação
  - Representa alertas e status de leitura por usuário.
*/