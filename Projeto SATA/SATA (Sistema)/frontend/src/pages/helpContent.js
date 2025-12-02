const helpContent = {
  '/': {
    title: 'Tela Inicial',
    intro: 'Acesse módulos e ações principais pelos azulejos e pelo menu lateral.',
    sections: [
      { title: 'Botões e ações', items: [
        'Azulejo Idosos: abre a lista de idosos para consultar, cadastrar e editar registros.',
        'Azulejo Quartos: abre a listagem de quartos para acompanhar status e criar novos.',
        'Azulejo Doações: abre o módulo de doações para registrar e gerenciar entradas.',
        'Azulejo Financeiro: abre o livro-caixa para cadastrar e analisar transações.'
      ]}
    ]
  },
  '/quartos': {
    title: 'Lista de Quartos',
    intro: 'Acompanhe quartos e execute ações rápidas na tabela.',
    sections: [
      { title: 'Botões e ações', items: [
        'Novo Quarto: cria um quarto informando número, capacidade e descrição.',
        'Filtros: restringe a lista por status e ordenação para localizar registros.',
        'Editar (lápis): abre o formulário do quarto selecionado para alteração de dados.',
        'Excluir (lixeira): remove o quarto selecionado da base após confirmação.'
      ]}
    ]
  },
  '/idosos': {
    title: 'Lista de Idosos',
    intro: 'Gerencie cadastros e ações relacionadas a residentes.',
    sections: [
      { title: 'Botões e ações', items: [
        'Novo Idoso: inicia o cadastro de um novo residente com dados obrigatórios.',
        'Internações: abre a página de internações que serve para acompanhar e criar internações de um idoso cadastrado.',
        'Editar (lápis): permite alterar dados do idoso selecionado.',
        'Dar Baixa (seta): altera o status de internado para não internado.',
        'Excluir (lixeira): remove o registro do idoso após confirmação.',
        'Detalhes (olho): abre a ficha com as informações completas do idoso.',
        'Observações: registra anotações associadas ao idoso.'
      ]}
    ]
  },
  '/internacoes': {
    title: 'Internações',
    intro: 'Registre entradas e saídas com vínculo de quarto e período.',
    sections: [
      { title: 'Botões e ações', items: [
        'Nova Internação: cria internação selecionando idoso, quarto e datas.',
        'Encerrar/Alta: finaliza uma internação indicando motivo e data.',
        'Status: filtra por Internações Ativas, Finalizadas ou Todas.'
      ]}
    ]
  },
  '/doadores': {
    title: 'Lista de Doadores',
    intro: 'Mantenha dados de doadores e execute ações na tabela.',
    sections: [
      { title: 'Botões e ações', items: [
        'Novo Doador: cria um cadastro com dados pessoais ou empresariais.',
        'Editar (lápis): atualiza informações do doador selecionado.',
        'Excluir (lixeira): remove o cadastro após confirmação.'
      ]}
    ]
  },
  '/doacoes': {
    title: 'Lista de Doações',
    intro: 'Registre e gerencie doações por tipo.',
    sections: [
      { title: 'Botões e ações', items: [
        'Nova Doação: inicia o registro de doação em dinheiro, alimento ou outros.',
        'Editar (lápis): altera dados da doação selecionada.',
        'Excluir (lixeira): remove a doação após confirmação.',
        'Imprimir: gera uma versão de impressão da lista ou ficha.'
      ]}
    ]
  },
  '/eventos': {
    title: 'Eventos',
    intro: 'Cadastre e edite eventos diretamente no calendário.',
    sections: [
      { title: 'Botões e ações', items: [
        'Novo Evento: abre o formulário para definir título, data, horário e local.',
        'Editar (lápis): altera dados do evento selecionado.',
        'Excluir (lixeira): remove o evento após confirmação.',
        'Detalhes (olho): abre a ficha de evento para consulta.',
        'Hoje: posiciona o calendário na data atual.',
        'Mês: exibe a visão mensal do calendário.',
        'Semana: exibe a visão semanal com horários.',
        'Dia: exibe a visão diária com horários.'
      ]}
    ]
  },
  '/produtos': {
    title: 'Estoque',
    intro: 'Gerencie produtos e movimentações de estoque.',
    sections: [
      { title: 'Botões e ações', items: [
        'Novo Produto: cria um item com unidade, categoria e preço (se aplicável).',
        'Movimentar: registra entrada, saída ou ajuste para atualizar o saldo.',
        'Detalhes (olho): abre a ficha do produto para consulta.',
        'Editar (lápis): altera dados do produto selecionado.'
      ]}
    ]
  },
  '/notificacoes': {
    title: 'Notificações',
    intro: 'Aplique filtros e execute ações em massa.',
    sections: [
      { title: 'Botões e ações', items: [
        'Marcar como lidas: define o estado de leitura das notificações selecionadas.',
        'Apagar selecionadas: remove permanentemente as notificações selecionadas.'
      ]}
    ]
  },
  '/financeiro': {
    title: 'Financeiro',
    intro: 'Cadastre transações e analise resultados com filtros.',
    sections: [
      { title: 'Botões e ações', items: [
        'Nova Transação: registra entrada ou saída com categoria e forma de pagamento.',
        'Imprimir: gera uma versão para impressão do livro-caixa ou da ficha.'
      ]}
    ]
  },
  '/perfis': {
    title: 'Perfis',
    intro: 'Gerencie usuários e seus papéis no sistema.',
    sections: [
      { title: 'Botões e ações', items: [
        'Mudar minha senha: inicia o fluxo para alterar a senha do usuário atual.',
        'Novo Perfil: cria um usuário com papel e credenciais definidas.',
        'Editar (lápis): altera dados do usuário selecionado.',
        'Excluir (lixeira): remove o usuário após confirmação.'
      ]}
    ]
  },
  '*': {
    title: 'Ajuda',
    intro: 'Este painel descreve as ações principais desta página.',
    sections: [
      { title: 'Botões e ações', items: [
        'Use os botões identificados por ícones para executar ações rápidas conforme descritas.'
      ]}
    ]
  }
};

export default helpContent;
