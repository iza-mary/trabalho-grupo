import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Modal, 
  Form,
  InputGroup,
  Alert,
  Badge,
  Spinner,
  Table
} from 'react-bootstrap';
import { 
  PlusCircle, 
  Search, 
  X,
  Building,
  BoxArrowRight,
  PersonFill,
  CalendarEvent,
  GeoAlt,
  Clock,
  ArrowLeft
} from 'react-bootstrap-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import './SataInternacoes.css';
import './SataInternacoes.modal.css';
import internacaoService from '../services/internacaoService.js';
import idosoService from '../services/idosoService.js';
import { quartoService } from '../services/quartoService.js';
import Navbar from '../components/Navbar';
import SearchSelect from '../components/SearchSelect';
import { useAuth } from '../hooks/useAuth';

const SataInternacoes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const [internacoes, setInternacoes] = useState([]);
  const [idosos, setIdosos] = useState([]);
  const [quartosDisponiveis, setQuartosDisponiveis] = useState([]);
  const [camasDisponiveis, setCamasDisponiveis] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState(null);
  
  // Estados para filtros e busca
  const [filtroStatus, setFiltroStatus] = useState('ativas');
  const [termoBusca, setTermoBusca] = useState('');
  
  // Estados para modal de nova internação
  const [mostrarModalNova, setMostrarModalNova] = useState(false);
  const [mostrarModalBaixa, setMostrarModalBaixa] = useState(false);
  const [internacaoSelecionada, setInternacaoSelecionada] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [quartosPorId, setQuartosPorId] = useState({});
  
  // Estados do formulário de nova internação
  const [novaInternacao, setNovaInternacao] = useState({
    idosoId: '',
    quartoId: '',
    cama: '',
    dataEntrada: new Date().toISOString().split('T')[0],
    observacoes: ''
  });

  // Parâmetros estáveis para busca remota de quartos (não utilizado com items locais)
  // Removido para evitar aviso de variável não utilizada

  useEffect(() => {
    carregarDados();
    
    // Verificar se há um idoso pré-selecionado na URL
    const params = new URLSearchParams(location.search);
    const idosoId = params.get('idosoId');
    if (idosoId) {
      setNovaInternacao(prev => ({ ...prev, idosoId }));
      setMostrarModalNova(true);
    }
  }, [location]);

  // Carregar camas disponíveis quando o quarto for selecionado
  useEffect(() => {
    if (novaInternacao.quartoId) {
      carregarCamasDisponiveis(novaInternacao.quartoId);
    } else {
      setCamasDisponiveis([]);
      setNovaInternacao(prev => ({ ...prev, cama: '' }));
    }
  }, [novaInternacao.quartoId]);

  // Polling suave para refletir disponibilidade em tempo real enquanto a modal está aberta
  useEffect(() => {
    if (!mostrarModalNova) return;
    const intervalId = setInterval(async () => {
      try {
        const quartos = await internacaoService.buscarQuartosDisponiveis();
        setQuartosDisponiveis(quartos);
        if (novaInternacao.quartoId) {
          const camas = await internacaoService.buscarCamasDisponiveis(novaInternacao.quartoId);
          setCamasDisponiveis(camas);
        }
      } catch {
        // Ignorar erros de polling para não interromper a UI
      }
    }, 5000);
    return () => clearInterval(intervalId);
  }, [mostrarModalNova, novaInternacao.quartoId]);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const [internacoesData, idososData, quartosData] = await Promise.all([
        internacaoService.listarTodas(),
        idosoService.getAll(),
        internacaoService.buscarQuartosDisponiveis()
      ]);
      
      // Garantir que dados inválidos da API não quebrem a renderização
      setInternacoes(Array.isArray(internacoesData) ? internacoesData : []);
      setIdosos(Array.isArray(idososData) ? idososData : []);
      setQuartosDisponiveis(Array.isArray(quartosData) ? quartosData : []);
    } catch (error) {
      setErroCarregamento(error.message);
      console.error('Erro ao carregar dados:', error);
    } finally {
      setCarregando(false);
    }
  };

  const carregarCamasDisponiveis = async (quartoId) => {
    try {
      const camas = await internacaoService.buscarCamasDisponiveis(quartoId);
      setCamasDisponiveis(Array.isArray(camas) ? camas : []);
    } catch (error) {
      console.error('Erro ao carregar camas disponíveis:', error);
      setCamasDisponiveis([]);
    }
  };

  const handleNovaInternacao = async (e) => {
    e.preventDefault();
    setSalvando(true);
    
    try {
      // Adaptar os dados para o formato esperado pelo backend
      const internacaoData = {
        idoso_id: novaInternacao.idosoId,
        quarto_id: novaInternacao.quartoId,
        cama: novaInternacao.cama,
        data_entrada: novaInternacao.dataEntrada,
        motivo_entrada: 'Internação regular',
        observacoes: novaInternacao.observacoes
      };
      
      await internacaoService.criar(internacaoData);
      await carregarDados();
      setMostrarModalNova(false);
      setNovaInternacao({
        idosoId: '',
        quartoId: '',
        cama: '',
        dataEntrada: new Date().toISOString().split('T')[0],
        observacoes: ''
      });
      setCamasDisponiveis([]);
    } catch (error) {
      console.error('Erro ao criar internação:', error);
      alert('Erro ao criar internação: ' + error.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleDarBaixa = async () => {
    setSalvando(true);
    
    try {
      await internacaoService.darBaixa(internacaoSelecionada.id);
      await carregarDados();
      setMostrarModalBaixa(false);
      setInternacaoSelecionada(null);
    } catch (error) {
      console.error('Erro ao dar baixa:', error);
      alert('Erro ao dar baixa: ' + error.message);
    } finally {
      setSalvando(false);
    }
  };

  const obterNomeIdoso = (idosoId) => {
    const idoso = idosos.find(i => i.id === idosoId);
    return idoso ? idoso.nome : 'Idoso não encontrado';
  };

  const obterNumeroQuarto = (quartoId) => {
    const quarto = quartosDisponiveis.find(q => String(q.id) === String(quartoId));
    if (quarto) return quarto.numero;
    const numeroCache = quartosPorId[String(quartoId)];
    return numeroCache !== undefined ? numeroCache : String(quartoId);
  };

  // Prefetch: garantir número do quarto mesmo quando não está em "disponíveis"
  useEffect(() => {
    const ids = Array.from(new Set((internacoes || []).map(i => i.quarto_id)));
    const missing = ids.filter(id => {
      const hasDisponivel = quartosDisponiveis.some(q => String(q.id) === String(id));
      const hasCache = Object.prototype.hasOwnProperty.call(quartosPorId, String(id));
      return !hasDisponivel && !hasCache;
    });
    if (missing.length === 0) return;
    (async () => {
      try {
        const entries = await Promise.all(missing.map(async (id) => {
          try {
            const resp = await quartoService.getById(id);
            const numero = resp?.data?.numero ?? null;
            return [String(id), numero];
          } catch {
            return [String(id), null];
          }
        }));
        const updates = {};
        entries.forEach(([id, numero]) => {
          if (numero !== null) updates[id] = numero;
        });
        if (Object.keys(updates).length > 0) {
          setQuartosPorId(prev => ({ ...prev, ...updates }));
        }
      } catch {
        // Silenciar erro de prefetch
      }
    })();
  }, [internacoes, quartosDisponiveis, quartosPorId]);

  const calcularDiasInternacao = (dataEntrada) => {
    const entrada = new Date(dataEntrada);
    const hoje = new Date();
    const diffTime = Math.abs(hoje - entrada);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Filtrar internações
  const internacoesFiltradas = internacoes.filter(internacao => {
    const matchStatus = filtroStatus === 'todas' || 
      (filtroStatus === 'ativas' && internacao.status === 'ativa') ||
      (filtroStatus === 'finalizadas' && internacao.status === 'finalizada');
    
    const nomeIdoso = obterNomeIdoso(internacao.idoso_id).toLowerCase();
    const numeroQuarto = obterNumeroQuarto(internacao.quarto_id).toString();
    const matchBusca = !termoBusca || 
      nomeIdoso.includes(termoBusca.toLowerCase()) ||
      numeroQuarto.includes(termoBusca) ||
      internacao.cama.toString().toLowerCase().includes(termoBusca.toLowerCase());
    
    return matchStatus && matchBusca;
  });

  if (carregando) {
    return (
      <Navbar>
        <Container fluid className="py-4 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Carregando...</span>
          </Spinner>
          <p className="mt-2">Carregando internações...</p>
        </Container>
      </Navbar>
    );
  }

  if (erroCarregamento) {
    return (
      <Navbar>
        <Container fluid className="py-4">
          <Alert variant="danger">
            <Alert.Heading>Erro ao carregar dados</Alert.Heading>
            <p>{erroCarregamento}</p>
            <Button variant="outline-danger" onClick={carregarDados}>
              Tentar novamente
            </Button>
          </Alert>
        </Container>
      </Navbar>
    );
  }

  return (
    <Navbar disableSidebar={mostrarModalNova}>
      <div className="content-area full-main">
        <Container fluid>
        {/* Header */}
        <div className="page-header">
          <div className="linha-cabecalho d-flex justify-content-between align-items-center">
            <div>
              <h2 className="page-title">
                <Building className="me-2" />
                Internações
              </h2>
              <p className="page-subtitle">
                Gerencie as internações dos idosos da instituição
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button 
                variant="secondary" 
                onClick={() => navigate('/idosos')}
                className="d-flex align-items-center"
                title="Voltar para lista de idosos"
              >
                <ArrowLeft className="me-2" />
                Voltar
              </Button>
              <Button 
                variant="primary" 
                onClick={() => isAdmin && setMostrarModalNova(true)}
                className={`btn-action ${!isAdmin ? 'disabled-action' : ''}`}
                disabled={!isAdmin}
                title={!isAdmin ? 'Apenas Administradores podem criar internações' : 'Nova Internação'}
              >
                <PlusCircle className="me-2" />
                Nova Internação
              </Button>
            </div>
          </div>
        </div>

          {/* Filtros e Busca */}
          <Row className="mb-4">
            <Col md={12}>
              <Card className="filter-card">
                <Card.Body>
                  <div className="d-flex gap-3 align-items-center">
                    <div>
                      <Form.Label className="mb-1 fw-bold">Status:</Form.Label>
                      <Form.Select 
                        value={filtroStatus} 
                        onChange={(e) => setFiltroStatus(e.target.value)}
                        className="form-control-sm"
                      >
                        <option value="ativas">Internações Ativas</option>
                        <option value="finalizadas">Internações Finalizadas</option>
                        <option value="todas">Todas as Internações</option>
                      </Form.Select>
                    </div>
                    <div className="flex-grow-1">
                      <Form.Label className="mb-1 fw-bold">Buscar:</Form.Label>
                      <InputGroup>
                        <InputGroup.Text title="Buscar">
                          <Search />
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="Buscar por nome do idoso, quarto ou cama..."
                          value={termoBusca}
                          onChange={(e) => setTermoBusca(e.target.value)}
                        />
                        {termoBusca && (
                          <Button 
                            variant="outline-secondary" 
                            onClick={() => setTermoBusca('')}
                            title="Limpar busca"
                          >
                            <X />
                          </Button>
                        )}
                      </InputGroup>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Métricas rápidas */}
          <Row className="mb-4">
            <Col md={4} sm={12} className="mb-3">
              <Card className="stats-card text-center">
                <Card.Body>
                  <h5 className="mb-1">{internacoes.filter(i => i.status === 'ativa').length}</h5>
                  <small className="text-muted">Internações Ativas</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} sm={12} className="mb-3">
              <Card className="stats-card text-center">
                <Card.Body>
                  <h5 className="mb-1">{internacoes.filter(i => i.status === 'finalizada').length}</h5>
                  <small className="text-muted">Internações Finalizadas</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} sm={12} className="mb-3">
              <Card className="stats-card text-center">
                <Card.Body>
                  <h5 className="mb-1">{internacoes.length}</h5>
                  <small className="text-muted">Total de Internações</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Lista de Internações */}
          {internacoesFiltradas.length === 0 ? (
            <Card className="text-center py-5">
              <Card.Body>
                <Building size={48} className="text-muted mb-3" />
                <h5 className="text-muted">Nenhuma internação encontrada</h5>
                <p className="text-muted">
                  {termoBusca ? 'Tente ajustar os filtros de busca.' : 'Não há internações cadastradas no momento.'}
                </p>
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Body>
                <Table responsive hover className="internacoes-table mb-0">
                  <thead>
                    <tr>
                      <th>Idoso</th>
                      <th>Quarto</th>
                      <th>Cama</th>
                      <th>Entrada</th>
                      <th>Status</th>
                      <th>Dias</th>
                      <th>Observações</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {internacoesFiltradas.map((internacao) => (
                      <tr key={internacao.id}>
                        <td className="fw-semibold">
                          <PersonFill className="me-2" />
                          {obterNomeIdoso(internacao.idoso_id)}
                        </td>
                        <td>{obterNumeroQuarto(internacao.quarto_id)}</td>
                        <td>{internacao.cama}</td>
                        <td>{new Date(internacao.data_entrada).toLocaleDateString('pt-BR')}</td>
                        <td>
                          <Badge bg={internacao.status === 'ativa' ? 'success' : 'secondary'} className="status-badge">
                            {internacao.status === 'ativa' ? 'Ativa' : 'Finalizada'}
                          </Badge>
                        </td>
                        <td>{internacao.status === 'ativa' ? calcularDiasInternacao(internacao.data_entrada) : '-'}</td>
                        <td><small className="text-muted">{internacao.observacoes ? String(internacao.observacoes).slice(0, 60) : '-'}</small></td>
                        <td>
                          {internacao.status === 'ativa' ? (
                            <Button 
                              variant="outline-warning" 
                              size="sm"
                              onClick={() => {
                                setInternacaoSelecionada(internacao);
                                setMostrarModalBaixa(true);
                              }}
                              title="Dar baixa"
                            >
                              <BoxArrowRight className="me-2" />
                              Baixa
                            </Button>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {/* Modal Nova Internação */}
          <Modal
            show={mostrarModalNova}
            onHide={() => setMostrarModalNova(false)}
            size="xl"
            centered
            backdrop="static"
            dialogClassName="modal-internacao-grande"
            contentClassName="modal-internacao-conteudo"
            className="modal-internacao"
            backdropClassName="modal-internacao-backdrop"
            scrollable
          >
            <Modal.Header>
              <Modal.Title>
                <PlusCircle className="me-2" />
                Nova Internação
              </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleNovaInternacao}>
              <Modal.Body>
                <Row>
                      <Col md={12} className="mb-3">
                        <Form.Label>Idoso *</Form.Label>
                        <Form.Select 
                          value={novaInternacao.idosoId}
                          onChange={(e) => setNovaInternacao({...novaInternacao, idosoId: e.target.value})}
                          required
                        >
                          <option value="">Selecione um idoso</option>
                          {idosos.filter(idoso => idoso.status !== 'internado').map(idoso => (
                            <option key={idoso.id} value={idoso.id}>{idoso.nome}</option>
                          ))}
                        </Form.Select>
                      </Col>
                      <Col md={6} className="mb-3">
                        <SearchSelect
                          label="Quarto"
                          required
                          items={quartosDisponiveis}
                          valueField="id"
                          displayField="numero"
                          formatDisplay={(q) => `Quarto ${q.numero}${q.descricao ? ` - ${q.descricao}` : ''}`}
                          minChars={0}
                          initialValue={(function(){
                            const qSel = quartosDisponiveis.find(q => String(q.id) === String(novaInternacao.quartoId));
                            return qSel || null;
                          })()}
                          onSelect={(item) => {
                            const id = item ? String(item.id) : '';
                            setNovaInternacao(prev => ({ ...prev, quartoId: id, cama: '' }));
                          }}
                          preserveSelectionOnItemsChange={true}
                        />
                      </Col>
                      <Col md={6} className="mb-3">
                        <SearchSelect
                          label="Cama"
                          required
                          disabled={!novaInternacao.quartoId}
                          items={camasDisponiveis
                            .filter(c => c !== novaInternacao.cama)
                            .map(c => ({ value: c, label: `Cama ${c}` }))}
                          initialValue={novaInternacao.cama ? { value: novaInternacao.cama, label: `Cama ${novaInternacao.cama}` } : null}
                          onSelect={(item) => {
                            const camaSel = item ? item.value : '';
                            setNovaInternacao(prev => ({ ...prev, cama: camaSel }));
                          }}
                          preserveSelectionOnItemsChange={true}
                        />
                        {novaInternacao.quartoId && camasDisponiveis.length === 0 && (
                          <Form.Text className="text-warning">
                            Nenhuma cama disponível neste quarto
                          </Form.Text>
                        )}
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Label>Data de Internação *</Form.Label>
                        <Form.Control
                          type="date"
                          value={novaInternacao.dataEntrada}
                          onChange={(e) => setNovaInternacao({ ...novaInternacao, dataEntrada: e.target.value })}
                          required
                        />
                      </Col>
                      <Col md={12} className="mb-3">
                        <Form.Label>Observações</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={novaInternacao.observacoes}
                          onChange={(e) => setNovaInternacao({...novaInternacao, observacoes: e.target.value})}
                          placeholder="Observações sobre a internação (opcional)"
                        />
                      </Col>
                </Row>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setMostrarModalNova(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={salvando || !novaInternacao.idosoId || !novaInternacao.quartoId || !novaInternacao.cama}
                >
                  {salvando ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Salvando...
                    </>
                  ) : (
                    'Criar Internação'
                  )}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>

          {/* Modal Dar Baixa */}
          <Modal show={mostrarModalBaixa} onHide={() => setMostrarModalBaixa(false)}>
            <Modal.Header closeButton>
              <Modal.Title>
                <BoxArrowRight className="me-2" />
                Confirmar Baixa
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>
                Tem certeza que deseja dar baixa na internação do idoso 
                <strong> {internacaoSelecionada ? obterNomeIdoso(internacaoSelecionada.idoso_id) : ''}</strong>?
              </p>
              <p>Esta ação irá alterar o status para "Não Internado".</p>
              {internacaoSelecionada && (
                <div className="mt-3">
                  <p><strong>Idoso:</strong> {obterNomeIdoso(internacaoSelecionada.idoso_id)}</p>
                  <p><strong>Quarto:</strong> {obterNumeroQuarto(internacaoSelecionada.quarto_id)} - <strong>Cama:</strong> {internacaoSelecionada.cama}</p>
                  <p><strong>Data de Entrada:</strong> {new Date(internacaoSelecionada.data_entrada).toLocaleDateString('pt-BR')}</p>
                  <p><strong>Dias internado:</strong> {calcularDiasInternacao(internacaoSelecionada.data_entrada)}</p>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setMostrarModalBaixa(false)}>
                Cancelar
              </Button>
              <Button 
                variant="warning" 
                onClick={handleDarBaixa}
                disabled={salvando}
              >
                {salvando ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Confirmando...
                  </>
                ) : (
                  'Confirmar Baixa'
                )}
              </Button>
            </Modal.Footer>
          </Modal>
        </Container>
      </div>
    </Navbar>
    );
  };
  
  export default SataInternacoes;