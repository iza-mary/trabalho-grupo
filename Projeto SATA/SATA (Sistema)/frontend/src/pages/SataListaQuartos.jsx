import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Alert, Modal, Spinner } from 'react-bootstrap';
import { PlusCircle, Funnel, Search, Pencil, Trash, HouseDoor } from 'react-bootstrap-icons';
import Navbar from '../components/Navbar';
import PageHeader from '../components/ui/PageHeader';
import StandardTable from '../components/ui/StandardTable';
import StatusBadge from '../components/ui/StatusBadge';
import ActionIconButton from '../components/ui/ActionIconButton';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { quartoService } from '../services/quartoService';
import './SataQuartos.css';

const SataListaQuartos = () => {
  const navigate = useNavigate();
  const [quartos, setQuartos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [ordenacao, setOrdenacao] = useState('numero_asc');
  const [termoBusca, setTermoBusca] = useState('');
  const [mostrarModalExclusao, setMostrarModalExclusao] = useState(false);
  const [quartoParaExcluir, setQuartoParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [mensagemExclusao, setMensagemExclusao] = useState(null);
  const [tipoMensagemExclusao, setTipoMensagemExclusao] = useState('success');
  const { isAdmin } = useAuth();

// Abre detalhes do quarto ao clicar na linha. Para Admin, navega para edição.
const abrirDetalhes = (quarto) => {
  if (!quarto) return;
  if (!isAdmin) return;
  navigate(`/quartos/editar/${quarto.id}`);
};

  useEffect(() => {
    const carregar = async () => {
      setCarregando(true);
      try {
        const result = await quartoService.getAll();
        const lista = result?.data || [];
        setQuartos(lista);
      } catch (e) {
        console.error('Erro ao carregar quartos:', e);
        setErro(e?.message || 'Erro ao carregar quartos');
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  const quartosFiltrados = useMemo(() => {
    let lista = Array.isArray(quartos) ? [...quartos] : [];
    if (filtroStatus) {
      lista = lista.filter(q => (q.status || '').toLowerCase() === filtroStatus);
    }
    if (termoBusca) {
      const t = termoBusca.toLowerCase();
      lista = lista.filter(q => {
        const numeroStr = String(q.numero || '').toLowerCase();
        const descStr = String(q.descricao || '').toLowerCase();
        return numeroStr.includes(t) || descStr.includes(t);
      });
    }
    switch (ordenacao) {
      case 'numero_asc':
        lista.sort((a, b) => String(a.numero).localeCompare(String(b.numero)));
        break;
      case 'numero_desc':
        lista.sort((a, b) => String(b.numero).localeCompare(String(a.numero)));
        break;
      case 'capacidade_asc':
        lista.sort((a, b) => (a.capacidade || 0) - (b.capacidade || 0));
        break;
      case 'capacidade_desc':
        lista.sort((a, b) => (b.capacidade || 0) - (a.capacidade || 0));
        break;
      default:
        break;
    }
    return lista;
  }, [quartos, filtroStatus, termoBusca, ordenacao]);

  const handleExcluirClick = (quarto) => {
    setQuartoParaExcluir(quarto);
    setMostrarModalExclusao(true);
  };

  const confirmarExclusao = async () => {
    if (!quartoParaExcluir) return;
    setExcluindo(true);
    try {
      await quartoService.delete(quartoParaExcluir.id);
      setQuartos((prev) => prev.filter((q) => q.id !== quartoParaExcluir.id));
      setTipoMensagemExclusao('success');
      setMensagemExclusao('Exclusão concluída com sucesso');
    } catch (e) {
      console.error('Erro ao excluir quarto:', e);
      setTipoMensagemExclusao('danger');
      setMensagemExclusao('Ocorreu um erro durante a exclusão');
    } finally {
      setExcluindo(false);
      setMostrarModalExclusao(false);
      setQuartoParaExcluir(null);
    }
  };

  if (carregando) {
    return (
      <Navbar>
        <Container fluid className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <Alert variant="info">Carregando quartos...</Alert>
        </Container>
      </Navbar>
    );
  }

  if (erro) {
    return (
      <Navbar>
        <Container fluid className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <Alert variant="danger">{erro}</Alert>
        </Container>
      </Navbar>
    );
  }

  return (
    <Navbar>
      <div className="content-area full-main">
        <Container fluid>
          <PageHeader
            title="Lista de Quartos"
            icon={<HouseDoor />}
            actions={
              <Button
                variant="primary"
                onClick={() => navigate('/quartos/cadastro')}
                aria-label="Cadastrar novo quarto"
                className={`d-inline-flex align-items-center ${!isAdmin ? 'disabled-action' : ''}`}
                disabled={!isAdmin}
              >
                <PlusCircle className="me-1" /> Novo Quarto
              </Button>
            }
          />

          {mensagemExclusao && (
            <Alert
              variant={tipoMensagemExclusao}
              onClose={() => setMensagemExclusao(null)}
              dismissible
              className="mb-3"
            >
              {mensagemExclusao}
            </Alert>
          )}

          {(!quartos || quartos.length === 0) ? (
            <Alert variant="info">Nenhum quarto cadastrado. Clique em "Novo Quarto" para começar.</Alert>
          ) : (
            <>
              <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Filtros e Busca</h5>
                  <button type="button" className="btn-sm btn btn-outline-secondary" data-bs-toggle="collapse" data-bs-target="#filtrosQuartos">
                    <Funnel className="me-1" size={16} /> Filtros
                  </button>
                </Card.Header>
                <Card.Body className="collapse show" id="filtrosQuartos">
                  <Row>
                    <Col md={3} className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} aria-label="Filtrar por status">
                        <option value="">Todos</option>
                        <option value="disponivel">Disponíveis</option>
                        <option value="ocupado">Ocupados</option>
                      </Form.Select>
                    </Col>
                    <Col md={3} className="mb-3">
                      <Form.Label>Ordenar por</Form.Label>
                      <Form.Select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)} aria-label="Ordenar lista">
                        <option value="numero_asc">Número (A-Z)</option>
                        <option value="numero_desc">Número (Z-A)</option>
                        <option value="capacidade_asc">Capacidade (Menor→Maior)</option>
                        <option value="capacidade_desc">Capacidade (Maior→Menor)</option>
                      </Form.Select>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label>Buscar</Form.Label>
                      <InputGroup>
                        <Form.Control type="text" placeholder="Número ou descrição..." value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} />
                        <InputGroup.Text><Search size={16} /></InputGroup.Text>
                      </InputGroup>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card>
                <Card.Header>
                  <h5 className="mb-0">Quartos Cadastrados</h5>
                </Card.Header>
                <Card.Body>
                  <StandardTable className="align-middle">
                    <thead>
                      <tr>
                        <th>Número</th>
                        <th>Capacidade</th>
                        <th>Descrição</th>
                        <th>Status</th>
                        <th style={{ width: 140 }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quartosFiltrados.map((q) => (
                        <tr key={q.id} role="button" onClick={() => abrirDetalhes(q)}>
                          <td>{q.numero}</td>
                          <td>{q.capacidade}</td>
                          <td>{q.descricao || '-'}</td>
                          <td><StatusBadge status={q.status} /></td>
                          <td>
                            <div className="botoes-acao d-flex align-items-center">
                              <ActionIconButton
                                variant="outline-primary"
                                title="Editar"
                                ariaLabel={`Editar quarto ${q.numero}`}
                                disabled={!isAdmin}
                                className={!isAdmin ? 'disabled-action' : ''}
                                onClick={!isAdmin ? undefined : () => navigate(`/quartos/editar/${q.id}`)}
                              >
                                <Pencil />
                              </ActionIconButton>
                              <ActionIconButton
                                variant="outline-danger"
                                title="Excluir"
                                ariaLabel={`Excluir quarto ${q.numero}`}
                                disabled={!isAdmin}
                                className={!isAdmin ? 'disabled-action ms-2' : 'ms-2'}
                                onClick={!isAdmin ? undefined : () => handleExcluirClick(q)}
                              >
                                <Trash />
                              </ActionIconButton>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </StandardTable>
                </Card.Body>
              </Card>

              {/* Modal de confirmação de exclusão */}
              <Modal show={mostrarModalExclusao} onHide={() => setMostrarModalExclusao(false)}>
                <Modal.Header closeButton>
                  <Modal.Title>Confirmar Exclusão</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <p>Tem certeza que deseja excluir este quarto?</p>
                  {quartoParaExcluir && (
                    <p className="fw-bold">Quarto {quartoParaExcluir.numero}</p>
                  )}
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={() => setMostrarModalExclusao(false)}>
                    Cancelar
                  </Button>
                  <Button variant="danger" onClick={confirmarExclusao} disabled={excluindo}>
                    {excluindo ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Excluindo...
                      </>
                    ) : (
                      'Excluir'
                    )}
                  </Button>
                </Modal.Footer>
              </Modal>
            </>
          )}
        </Container>
      </div>
    </Navbar>
  );
};

export default SataListaQuartos;