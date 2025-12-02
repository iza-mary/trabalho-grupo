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
import { useAuth } from '../hooks/useAuth';
import './SataInternacoes.css';
import './SataInternacoes.modal.css';
import internacaoService from '../services/internacaoService.js';
import idosoService from '../services/idosoService.js';
import { quartoService } from '../services/quartoService.js';
import Navbar from '../components/Navbar';
import HelpButton from '../components/ui/HelpButton';
import SearchSelect from '../components/SearchSelect';

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
    dataEntrada: new Date().toISOString().split('T')[0]
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
        motivo_entrada: 'Internação regular'
      };
      
      await internacaoService.criar(internacaoData);
      await carregarDados();
      setMostrarModalNova(false);
      setNovaInternacao({
        idosoId: '',
        quartoId: '',
        cama: '',
        dataEntrada: new Date().toISOString().split('T')[0]
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
      <div className="py-4 container-fluid">
        {/* Header */}
        <div className="page-header">
          <div className="linha-cabecalho d-flex justify-content-between align-items-center">
            <div>
              <h2 className="page-title">
                <Building className="me-2" />
                Internações
                <span className="ms-2 d-inline-flex align-items-center"><HelpButton inline iconOnly /></span>
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
                          placeholder="Buscar..."
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
                        <td>{internacao.cama_nome || internacao.cama}</td>
                        <td>{new Date(internacao.data_entrada).toLocaleDateString('pt-BR')}</td>
                        <td>
                          <Badge bg={internacao.status === 'ativa' ? 'success' : 'secondary'} className="status-badge">
                            {internacao.status === 'ativa' ? 'Ativa' : 'Finalizada'}
                          </Badge>
                        </td>
                        <td>{internacao.status === 'ativa' ? calcularDiasInternacao(internacao.data_entrada) : '-'}</td>
                        <td>
                          {internacao.status === 'ativa' ? (
                            <Button 
                              variant="outline-warning" 
                              size="sm"
                              disabled={!isAdmin}
                              className={!isAdmin ? 'disabled-action' : ''}
                              onClick={!isAdmin ? undefined : () => {
                                setInternacaoSelecionada(internacao);
                                setMostrarModalBaixa(true);
                              }}
                              title={!isAdmin ? 'Apenas Administradores podem dar baixa' : 'Dar baixa'}
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
                          items={camasDisponiveis.map(c => ({ value: c.id, label: c.nome }))}
                          initialValue={novaInternacao.cama ? { value: novaInternacao.cama, label: (camasDisponiveis.find(c => String(c.id) === String(novaInternacao.cama))?.nome || `Cama ${novaInternacao.cama}`) } : null}
                          onSelect={(item) => {
                            const camaSel = item ? item.value : '';
                            setNovaInternacao(prev => ({ ...prev, cama: camaSel }));
                          }}
                          disabled={!novaInternacao.quartoId}
                          placeholder={!novaInternacao.quartoId ? 'Selecione um quarto primeiro' : 'Buscar cama...'}
                        />
                      </Col>
                      <Col md={12} className="mb-3">
                        <Form.Group controlId="dataEntrada">
                          <Form.Label>Data de Entrada *</Form.Label>
                          <Form.Control
                            type="date"
                            value={novaInternacao.dataEntrada}
                            onChange={(e) => setNovaInternacao({...novaInternacao, dataEntrada: e.target.value})}
                            required
                          />
                        </Form.Group>
                      </Col>
                      
                </Row>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setMostrarModalNova(false)} disabled={salvando}>
                  Cancelar
                </Button>
                <Button variant="primary" type="submit" disabled={salvando}>
                  {salvando ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Salvar'}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>

          {/* Modal de confirmação de baixa */}
          <Modal show={mostrarModalBaixa} onHide={() => setMostrarModalBaixa(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>Confirmar Baixa</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              Tem certeza que deseja dar baixa na internação de <strong>{internacaoSelecionada?.idoso_id && obterNomeIdoso(internacaoSelecionada.idoso_id)}</strong>?
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setMostrarModalBaixa(false)} disabled={salvando}>
                Cancelar
              </Button>
              <Button variant="warning" onClick={handleDarBaixa} disabled={salvando}>
                {salvando ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Confirmar Baixa'}
              </Button>
            </Modal.Footer>
          </Modal>
      </div>
    </Navbar>
    );
  };
  
  export default SataInternacoes;
