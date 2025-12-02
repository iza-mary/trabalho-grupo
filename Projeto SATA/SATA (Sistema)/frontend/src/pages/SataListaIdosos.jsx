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
  Alert
} from 'react-bootstrap';
import { 
  PlusCircle, 
  Funnel, 
  Pencil, 
  Trash, 
  Eye,
  Building,
  BoxArrowRight,
  Clipboard,
  ExclamationTriangleFill
} from 'react-bootstrap-icons';
import PageHeader from '../components/ui/PageHeader';
import HelpButton from '../components/ui/HelpButton';
import StandardTable from '../components/ui/StandardTable';
import StatusBadge from '../components/ui/StatusBadge';
import ActionIconButton from '../components/ui/ActionIconButton';
import { useNavigate } from 'react-router-dom';
import BotaoRegistrarObservacao from '../components/idosos/BotaoRegistrarObservacao';
import ObservacaoModal from '../components/idosos/ObservacaoModal';
import './SataListaIdosos.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import idosoService from '../services/idosoService';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';

const SataListaIdosos = () => {
  const navigate = useNavigate();
  const [mostrarModalExclusao, setMostrarModalExclusao] = useState(false);
  const [mostrarModalConfirmacao, setMostrarModalConfirmacao] = useState(false);
  const [mostrarModalAlertaInternado, setMostrarModalAlertaInternado] = useState(false);
  const [mostrarModalAlertaRelacionamentos, setMostrarModalAlertaRelacionamentos] = useState(false);
  const [mensagemAlertaRelacionamentos, setMensagemAlertaRelacionamentos] = useState('');
  const [mostrarModalObservacao, setMostrarModalObservacao] = useState(false);
  const [idosoSelecionado, setIdosoSelecionado] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroOrdenacao, setFiltroOrdenacao] = useState('nome_asc');
  const [termoBusca, setTermoBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState(null);
  const [idosos, setIdosos] = useState([]);
  const { user, isAdmin } = useAuth();
  const isFuncionarioOnly = !isAdmin && user?.role === 'Funcionário';
  const disableActions = isFuncionarioOnly;

  useEffect(() => {
    const carregarIdosos = async () => {
      try {
        const dados = await idosoService.getAll();
        setIdosos(dados);
      } catch (error) {
        setErroCarregamento(error.message);
        console.error('Erro completo:', error);
      } finally {
        setCarregando(false);
      }
    };
    carregarIdosos();
  }, []);

  const handleExcluirClick = (idoso) => {
    setIdosoSelecionado(idoso);
    if (idoso?.status === 'internado') {
      setMostrarModalAlertaInternado(true);
      return;
    }
    setMostrarModalExclusao(true);
  };

  const handleSaveObservacao = async (observacaoData) => {
    try {
      await idosoService.addObservacao(idosoSelecionado.id, observacaoData);
      setMostrarModalObservacao(false);
    } catch (error) {
      console.error('Erro ao salvar observação:', error);
      throw error;
    }
  };

  const confirmarExclusao = async () => {
    if (disableActions) return;
    try {
      await idosoService.remove(idosoSelecionado.id);
      const novosDados = idosos.filter(item => item.id !== idosoSelecionado.id);
      setIdosos(novosDados);
      setMostrarModalExclusao(false);
    } catch (error) {
      console.error('Erro ao excluir idoso:', error);
      const status = error?.response?.status;
      const message = error?.response?.data?.message || 'Erro ao excluir idoso. Tente novamente mais tarde.';
      if (status === 409) {
        setMensagemAlertaRelacionamentos(message);
        setMostrarModalExclusao(false);
        setMostrarModalAlertaRelacionamentos(true);
        return;
      }
      alert(message);
    }
  };

  const handleDarBaixa = async () => {
    if (disableActions) return;
    try {
      // Atualizar status do idoso para "nao_internado"
      await idosoService.updateStatus(idosoSelecionado.id, 'nao_internado');
      // Recarregar a lista de idosos
      const dados = await idosoService.getAll();
      setIdosos(dados);
      setMostrarModalConfirmacao(false);
      alert('Baixa realizada com sucesso!');
    } catch (error) {
      console.error('Erro ao dar baixa:', error);
      alert('Erro ao dar baixa. Tente novamente.');
    }
  };

  const calcularIdade = (dataNascimento) => {
    if (!dataNascimento) return 0;
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  const idososFiltrados = idosos.filter(idoso => {
    if (filtroStatus === 'internado' && idoso.status !== 'internado') {
      return false;
    }
    if (filtroStatus === 'nao_internado' && idoso.status === 'internado') {
      return false;
    }
    
    if (termoBusca) {
      const termo = termoBusca.toLowerCase();
      return (
        idoso.nome.toLowerCase().includes(termo) ||
        (idoso.cpf && idoso.cpf.toString().includes(termo)) ||
        (idoso.cidade && idoso.cidade.toLowerCase().includes(termo))
      );
    }
    
    return true;
  });

  const idososOrdenados = [...idososFiltrados].sort((a, b) => {
    switch (filtroOrdenacao) {
      case 'nome_asc':
        return a.nome.localeCompare(b.nome);
      case 'nome_desc':
        return b.nome.localeCompare(a.nome);
      case 'data_asc':
        return new Date(a.dataEntrada || '9999-12-31') - 
               new Date(b.dataEntrada || '9999-12-31');
      case 'data_desc':
        return new Date(b.dataEntrada || '0001-01-01') - 
               new Date(a.dataEntrada || '0001-01-01');
      case 'idade_asc':
        return calcularIdade(a.dataNascimento) - calcularIdade(b.dataNascimento);
      case 'idade_desc':
        return calcularIdade(b.dataNascimento) - calcularIdade(a.dataNascimento);
      default:
        return 0;
    }
  });

  if (carregando) {
    return (
      <Navbar>
        <Container fluid className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <Alert variant="info">Carregando dados...</Alert>
        </Container>
      </Navbar>
    );
  }

  if (erroCarregamento) {
    return (
      <Navbar>
        <Container fluid className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <Alert variant="danger">{erroCarregamento}</Alert>
        </Container>
      </Navbar>
    );
  }

  return (
    <Navbar>
      <div className="content-area full-main">
        <Container fluid>
          <PageHeader
            title="Lista de Idosos Cadastrados"
            icon={<Clipboard />}
            suffix={<HelpButton inline iconOnly />}
            actions={
              <>
                <Button 
                  variant="primary"
                  onClick={(e) => { if (disableActions) { e.preventDefault(); e.stopPropagation(); return; } navigate('/cadastro'); }}
                  aria-label="Cadastrar novo idoso"
                  className={disableActions ? 'me-2 disabled-action' : 'me-2'}
                  disabled={disableActions}
                >
                  <PlusCircle className="me-1" /> Novo Idoso
                </Button>
                <Button 
                  variant="success"
                  onClick={() => navigate('/internacoes')}
                  aria-label="Gerenciar internações"
                >
                  <Building className="me-1" /> Internações
                </Button>
              </>
            }
          />

          {idosos.length === 0 ? (
            <Alert variant="info">
              Nenhum idoso cadastrado. Clique em "Novo Idoso" para começar.
            </Alert>
          ) : (
            <>
              <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Filtros e Busca</h5>
                  <button 
                    type="button" 
                    className="btn-sm btn btn-outline-secondary"
                    data-bs-toggle="collapse"
                    data-bs-target="#filtrosCollapse"
                    title="Mostrar/ocultar filtros"
                  >
                    <Funnel className="me-1" size={16} />
                    Filtros
                  </button>
                </Card.Header>
                <Card.Body className="collapse show" id="filtrosCollapse">
                  <Row>
                    <Col md={3} className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Select 
                        value={filtroStatus} 
                        onChange={(e) => setFiltroStatus(e.target.value)}
                        aria-label="Filtrar por status"
                      >
                        <option value="">Todos</option>
                        <option value="internado">Internados</option>
                        <option value="nao_internado">Não Internados</option>
                      </Form.Select>
                    </Col>
                    <Col md={3} className="mb-3">
                      <Form.Label>Ordenar por</Form.Label>
                      <Form.Select 
                        value={filtroOrdenacao} 
                        onChange={(e) => setFiltroOrdenacao(e.target.value)}
                        aria-label="Ordenar lista"
                      >
                        <option value="nome_asc">Nome (A-Z)</option>
                        <option value="nome_desc">Nome (Z-A)</option>
                        <option value="data_asc">Data de Entrada (Mais antigo)</option>
                        <option value="data_desc">Data de Entrada (Mais recente)</option>
                        <option value="idade_asc">Idade (Mais jovem)</option>
                        <option value="idade_desc">Idade (Mais idoso)</option>
                      </Form.Select>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label>Buscar</Form.Label>
                      <InputGroup>
                        <Form.Control 
                          type="text" 
                          placeholder="Buscar..."
                          value={termoBusca}
                          onChange={(e) => setTermoBusca(e.target.value)}
                          aria-label="Campo de busca"
                        />
                      </InputGroup>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card>
                <Card.Header className="d-flex align-items-center justify-content-between">
                  <h5 className="mb-0">Idosos</h5>
                  <Button variant="outline-secondary" onClick={() => {
                    const params = new URLSearchParams();
                    if (filtroStatus) params.set('status', filtroStatus);
                    if (filtroOrdenacao) params.set('ordenacao', filtroOrdenacao);
                    if (termoBusca) params.set('busca', termoBusca);
                    navigate(`/idosos/impressao?${params.toString()}`)
                  }}>
                    Imprimir
                  </Button>
                </Card.Header>
                <Card.Body>
                    {idososOrdenados.length === 0 ? (
                      <Alert variant="warning">
                        Nenhum idoso encontrado com os filtros atuais.
                      </Alert>
                    ) : (
                      <StandardTable>
                        <thead>
                          <tr>
                            <th>Nome</th>
                            <th>Idade</th>
                            <th>CPF</th>
                            <th>Cidade</th>
                            <th>Status</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {idososOrdenados.map(idoso => (
                            <tr key={idoso.id}>
                              <td>{idoso.nome}</td>
                              <td>{calcularIdade(idoso.dataNascimento)}</td>
                              <td>{idoso.cpf}</td>
                              <td>{idoso.cidade}</td>
                              <td>
                                <StatusBadge status={idoso.status} />
                              </td>
                              <td className="botoes-acao">
                                <BotaoRegistrarObservacao to={`/detalhes/${idoso.id}/observacoes`} compact />
                                <ActionIconButton
                                  variant="outline-primary" 
                                  size="sm"
                                  title="Editar"
                                  ariaLabel={`Editar ${idoso.nome}`}
                                  onClick={() => { if (disableActions) return; navigate(`/editar/${idoso.id}`); }}
                                  disabled={disableActions}
                                  className={disableActions ? 'disabled-action' : undefined}
                                >
                                  <Pencil />
                                </ActionIconButton>
                                
                                {/* Mostrar botão de internação OU botão de baixa */}
                                {idoso.status !== 'internado' ? (
                                  <ActionIconButton
                                    variant="outline-info" 
                                    size="sm"
                                    title={!isAdmin ? 'Apenas Administradores podem criar internações' : 'Internação'}
                                    ariaLabel={`Internação para ${idoso.nome}`}
                                    onClick={() => { if (disableActions) return; navigate('/internacoes?idosoId=' + idoso.id); }}
                                    disabled={disableActions}
                                    className={disableActions ? 'disabled-action' : undefined}
                                  >
                                    <Building />
                                  </ActionIconButton>
                                ) : (
                                  <ActionIconButton
                                    variant="outline-warning" 
                                    size="sm"
                                    title="Dar Baixa"
                                    ariaLabel={`Dar baixa para ${idoso.nome}`}
                                    onClick={() => { if (disableActions) return; setIdosoSelecionado(idoso); setMostrarModalConfirmacao(true); }}
                                    className={disableActions ? 'me-1 disabled-action' : 'me-1'}
                                    disabled={disableActions}
                                  >
                                    <BoxArrowRight />
                                  </ActionIconButton>
                                )}
                                
                                <ActionIconButton
                                  variant="outline-danger" 
                                  size="sm"
                                  title="Excluir"
                                  ariaLabel={`Excluir ${idoso.nome}`}
                                  onClick={() => { if (disableActions) return; handleExcluirClick(idoso); }}
                                  disabled={disableActions}
                                  className={disableActions ? 'disabled-action' : undefined}
                                >
                                  <Trash />
                                </ActionIconButton>
                                <ActionIconButton
                                  variant="outline-secondary" 
                                  size="sm"
                                  title="Detalhes"
                                  ariaLabel={`Ver detalhes de ${idoso.nome}`}
                                  onClick={() => navigate(`/detalhes/${idoso.id}`)}
                                >
                                  <Eye />
                                </ActionIconButton>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </StandardTable>
                    )}
                </Card.Body>
              </Card>
            </>
          )}

          <Modal show={mostrarModalExclusao} onHide={() => setMostrarModalExclusao(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Confirmar Exclusão</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>Tem certeza que deseja excluir este idoso? Esta ação não pode ser desfeita.</p>
              <p className="fw-bold">{idosoSelecionado?.nome}</p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setMostrarModalExclusao(false)}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={confirmarExclusao} disabled={disableActions} className={disableActions ? 'disabled-action' : undefined}>
                Excluir
              </Button>
            </Modal.Footer>
          </Modal>

          <Modal show={mostrarModalConfirmacao} onHide={() => setMostrarModalConfirmacao(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Confirmar Baixa</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>Tem certeza que deseja dar baixa no idoso <strong>{idosoSelecionado?.nome}</strong>?</p>
              <p>Esta ação irá alterar o status para "Não Internado".</p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setMostrarModalConfirmacao(false)}>
                Cancelar
              </Button>
              <Button variant="warning" onClick={handleDarBaixa} disabled={disableActions} className={disableActions ? 'disabled-action' : undefined}>
                Confirmar Baixa
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Modal de alerta para exclusão de idoso internado */}
          <Modal show={mostrarModalAlertaInternado} onHide={() => setMostrarModalAlertaInternado(false)} backdrop="static" keyboard={false} centered>
            <Modal.Header>
              <Modal.Title>Operação não permitida</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="p-3 rounded border border-danger bg-danger-subtle d-flex align-items-start">
                <ExclamationTriangleFill className="text-danger me-2" size={24} />
                <div>
                  <p className="mb-1">Não é possível excluir este idoso pois ele está atualmente internado. Por favor, atualize o status do idoso antes de tentar novamente.</p>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="danger" onClick={() => setMostrarModalAlertaInternado(false)}>OK</Button>
            </Modal.Footer>
          </Modal>

          {/* Modal de alerta para exclusão bloqueada por relacionamentos */}
          <Modal show={mostrarModalAlertaRelacionamentos} onHide={() => setMostrarModalAlertaRelacionamentos(false)} backdrop="static" keyboard={false} centered>
            <Modal.Header>
              <Modal.Title>Operação bloqueada</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="p-3 rounded border border-danger bg-danger-subtle d-flex align-items-start">
                <ExclamationTriangleFill className="text-danger me-2" size={24} />
                <div>
                  <p className="mb-1">{mensagemAlertaRelacionamentos || 'Não é possível excluir este idoso por existir vínculo com outros registros.'}</p>
                  <p className="mb-0 small text-muted">Caso necessário, avalie remover ou desvincular registros relacionados (ex.: internações).</p>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="danger" onClick={() => setMostrarModalAlertaRelacionamentos(false)}>OK</Button>
            </Modal.Footer>
          </Modal>

          <ObservacaoModal
            show={mostrarModalObservacao}
            onHide={() => setMostrarModalObservacao(false)}
            onSave={handleSaveObservacao}
            idosoId={idosoSelecionado?.id}
            usuarioId={user?.id}
          />
        </Container>
      </div>
    </Navbar>
  );
};

export default SataListaIdosos;
