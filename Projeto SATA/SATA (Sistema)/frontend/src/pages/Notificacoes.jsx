import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, InputGroup, Alert, Spinner } from 'react-bootstrap';
import { BsBell, BsSearch, BsFilter, BsCheck2All, BsEye, BsEyeSlash, BsTrash } from 'react-icons/bs';
import Navbar from '../components/Navbar';
import PageHeader from '../components/ui/PageHeader';
import HelpButton from '../components/ui/HelpButton';
import { 
  listarNotificacoes, 
  marcarComoLida, 
  marcarVariasComoLidas, 
  obterContadores, 
  deletarVariasNotificacoes 
} from '../services/notificacoesService';
import './Notificacoes.css';
import api from '../services/api';

const Notificacoes = () => {
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({
    tipo: '',
    lida: '',
    busca: '',
    prioridade: ''
  });
  const [contadores, setContadores] = useState({ total: 0, nao_lidas: 0 });
  const [selecionadas, setSelecionadas] = useState([]);
  const [paginacao, setPaginacao] = useState({
    pagina: 1,
    limite: 10,
    total: 0
  });

  const carregarNotificacoes = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        ...filtros,
        pagina: paginacao.pagina,
        limite: paginacao.limite,
        ordenacao: 'data_criacao',
        direcao: 'DESC'
      };
      
      // Remove filtros vazios
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key];
      });

      const response = await listarNotificacoes(params);
      setNotificacoes(response.notificacoes || []);
      setPaginacao(prev => ({ ...prev, total: response.total || 0 }));
    } catch (err) {
      setError('Erro ao carregar notificações: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [filtros, paginacao.pagina, paginacao.limite]);

  const carregarContadores = useCallback(async () => {
    try {
      const response = await obterContadores();
      setContadores(response);
    } catch (err) {
      console.error('Erro ao carregar contadores:', err);
    }
  }, []);

  useEffect(() => {
    carregarNotificacoes();
    carregarContadores();
  }, [carregarNotificacoes, carregarContadores]);

  useEffect(() => {
    let es;
    let timer;
    const startPolling = () => {
      carregarNotificacoes();
      carregarContadores();
      timer = setInterval(() => {
        carregarNotificacoes();
        carregarContadores();
      }, 30000);
    };
    try {
      const base = (api && api.defaults && api.defaults.baseURL) ? api.defaults.baseURL.replace(/\/$/, '') : '';
      const url = base ? `${base}/notificacoes/stream` : '/api/notificacoes/stream';
      es = new EventSource(url, { withCredentials: true });
      es.addEventListener('new', () => {
        carregarNotificacoes();
        carregarContadores();
      });
      es.addEventListener('error', () => {
        if (es && es.close) es.close();
        startPolling();
      });
    } catch {
      startPolling();
    }
    return () => {
      if (es && es.close) es.close();
      if (timer) clearInterval(timer);
    };
  }, [carregarNotificacoes, carregarContadores]);

  const handleMarcarComoLida = async (id) => {
    try {
      await marcarComoLida(id);
      await carregarNotificacoes();
      await carregarContadores();
    } catch (err) {
      setError('Erro ao marcar notificação como lida: ' + err.message);
    }
  };

  const handleMarcarSelecionadasComoLidas = async () => {
    if (selecionadas.length === 0) return;
    
    try {
      await marcarVariasComoLidas(selecionadas);
      setSelecionadas([]);
      await carregarNotificacoes();
      await carregarContadores();
    } catch (err) {
      setError('Erro ao marcar notificações como lidas: ' + err.message);
    }
  };

  const handleApagarSelecionadas = async () => {
    if (selecionadas.length === 0) return;
    try {
      await deletarVariasNotificacoes(selecionadas);
      setSelecionadas([]);
      await carregarNotificacoes();
      await carregarContadores();
    } catch (err) {
      setError('Erro ao apagar notificações: ' + err.message);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
    setPaginacao(prev => ({ ...prev, pagina: 1 }));
  };

  const handleSelecionar = (id) => {
    setSelecionadas(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelecionarTodas = () => {
    const todasIds = notificacoes.map(n => n.id);
    setSelecionadas(prev => 
      prev.length === todasIds.length ? [] : todasIds
    );
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const obterVariantePrioridade = (prioridade) => {
    switch (prioridade) {
      case 'alta': return 'danger';
      case 'media': return 'warning';
      case 'baixa': return 'info';
      default: return 'secondary';
    }
  };

  const obterIconeTipo = (tipo) => {
    switch (tipo) {
      case 'cadastro': return '👤';
      case 'estoque_baixo': return '📦';
      case 'transacao_financeira': return '💰';
      case 'evento_proximo': return '📅';
      default: return '🔔';
    }
  };

  const obterLabelTipo = (tipo) => {
    switch (tipo) {
      case 'cadastro': return 'Cadastro';
      case 'estoque_baixo': return 'Estoque Baixo';
      case 'transacao_financeira': return 'Transação';
      case 'evento_proximo': return 'Evento';
      default: return tipo;
    }
  };

  return (
    <Navbar>
      <Container fluid className="p-3">
        <PageHeader 
          title="Notificações" 
          icon={<BsBell />}
          suffix={<HelpButton inline iconOnly />}
          actions={
            <div className="d-flex gap-2">
              <Badge bg="primary" className="fs-6">
                Total: {contadores.total}
              </Badge>
              <Badge bg="warning" className="fs-6">
                Não lidas: {contadores.nao_lidas}
              </Badge>
            </div>
          }
        />

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Filtros */}
        <Card className="mb-4">
          <Card.Body>
            <Row className="g-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Buscar</Form.Label>
                  <InputGroup>
                    <InputGroup.Text><BsSearch /></InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Buscar..."
                      value={filtros.busca}
                      onChange={(e) => handleFiltroChange('busca', e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Tipo</Form.Label>
                  <Form.Select
                    value={filtros.tipo}
                    onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="cadastro">Cadastro</option>
                    <option value="estoque_baixo">Estoque Baixo</option>
                    <option value="transacao_financeira">Transação</option>
                    <option value="evento_proximo">Evento</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={filtros.lida}
                    onChange={(e) => handleFiltroChange('lida', e.target.value)}
                  >
                    <option value="">Todas</option>
                    <option value="false">Não lidas</option>
                    <option value="true">Lidas</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Prioridade</Form.Label>
                  <Form.Select
                    value={filtros.prioridade}
                    onChange={(e) => handleFiltroChange('prioridade', e.target.value)}
                  >
                    <option value="">Todas</option>
                    <option value="alta">Alta</option>
                    <option value="media">Média</option>
                    <option value="baixa">Baixa</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3} className="d-flex align-items-end">
                {selecionadas.length > 0 && (
                  <>
                    <Button 
                      variant="outline-primary" 
                      onClick={handleMarcarSelecionadasComoLidas}
                      className="me-2"
                    >
                      <BsCheck2All className="me-1" />
                      Marcar como lidas ({selecionadas.length})
                    </Button>
                    <Button
                      variant="outline-danger"
                      onClick={handleApagarSelecionadas}
                    >
                      <BsTrash className="me-1" />
                      Apagar selecionadas ({selecionadas.length})
                    </Button>
                  </>
                )}
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Lista de Notificações */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Carregando...</span>
            </Spinner>
          </div>
        ) : notificacoes.length === 0 ? (
          <Card>
            <Card.Body className="text-center py-5">
              <BsBell size={48} className="text-muted mb-3" />
              <h5 className="text-muted">Nenhuma notificação encontrada</h5>
              <p className="text-muted">Não há notificações que correspondam aos filtros selecionados.</p>
            </Card.Body>
          </Card>
        ) : (
          <>
            {/* Controles de seleção */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Form.Check
                type="checkbox"
                label="Selecionar todas"
                checked={selecionadas.length === notificacoes.length && notificacoes.length > 0}
                onChange={handleSelecionarTodas}
              />
              {/* contador removido conforme solicitação */}
            </div>

            {/* Cards de Notificações */}
            <div className="notificacoes-lista">
              {notificacoes.map((notificacao) => (
                <Card 
                  key={notificacao.id} 
                  className={`mb-3 notificacao-card ${!notificacao.lida ? 'nao-lida' : ''}`}
                >
                  <Card.Body>
                    <Row>
                      <Col xs="auto">
                        <Form.Check
                          type="checkbox"
                          checked={selecionadas.includes(notificacao.id)}
                          onChange={() => handleSelecionar(notificacao.id)}
                        />
                      </Col>
                      <Col xs="auto" className="pe-0">
                        <div className="notificacao-icone">
                          {obterIconeTipo(notificacao.tipo)}
                        </div>
                      </Col>
                      <Col>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="mb-1 d-flex align-items-center gap-2">
                              {notificacao.titulo}
                              <Badge bg={obterVariantePrioridade(notificacao.prioridade)} size="sm">
                                {notificacao.prioridade}
                              </Badge>
                              <Badge bg="secondary" size="sm">
                                {obterLabelTipo(notificacao.tipo)}
                              </Badge>
                              {!notificacao.lida && (
                                <Badge bg="primary" size="sm">Nova</Badge>
                              )}
                            </h6>
                            <p className="mb-1 text-muted">{notificacao.descricao}</p>
                            <small className="text-muted">
                              {formatarData(notificacao.data_criacao)}
                            </small>
                          </div>
                          <div className="d-flex gap-1">
                            {!notificacao.lida && (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleMarcarComoLida(notificacao.id)}
                                title="Marcar como lida"
                              >
                                <BsEye />
                              </Button>
                            )}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              ))}
            </div>

            {/* Paginação */}
            {paginacao.total > paginacao.limite && (
              <div className="d-flex justify-content-center mt-4">
                <Button
                  variant="outline-primary"
                  disabled={paginacao.pagina === 1}
                  onClick={() => setPaginacao(prev => ({ ...prev, pagina: prev.pagina - 1 }))}
                  className="me-2"
                >
                  Anterior
                </Button>
                <span className="align-self-center mx-3">
                  Página {paginacao.pagina} de {Math.ceil(paginacao.total / paginacao.limite)}
                </span>
                <Button
                  variant="outline-primary"
                  disabled={paginacao.pagina >= Math.ceil(paginacao.total / paginacao.limite)}
                  onClick={() => setPaginacao(prev => ({ ...prev, pagina: prev.pagina + 1 }))}
                  className="ms-2"
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        )}
      </Container>
    </Navbar>
  );
};

export default Notificacoes;
/*
  Página Notificações
  - Lista notificações do usuário, contadores e marcações de leitura.
*/
