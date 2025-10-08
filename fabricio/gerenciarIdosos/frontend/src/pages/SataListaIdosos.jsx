import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Table, 
  Modal, 
  Form,
  InputGroup,
  Alert,
  Badge
} from 'react-bootstrap';
import { 
  PlusCircle, 
  Funnel, 
  Search, 
  Pencil, 
  Trash, 
  Eye,
  X,
  Building,
  BoxArrowRight
} from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import './SataListaIdosos.css';
import idosoService from '../services/idosoService';
import Lateral from '../components/Lateral';

const SataListaIdosos = () => {
  const navigate = useNavigate();
  const [mostrarModalExclusao, setMostrarModalExclusao] = useState(false);
  const [mostrarModalConfirmacao, setMostrarModalConfirmacao] = useState(false);
  const [idosoSelecionado, setIdosoSelecionado] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroOrdenacao, setFiltroOrdenacao] = useState('nome_asc');
  const [termoBusca, setTermoBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState(null);
  const [idosos, setIdosos] = useState([]);

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
    setMostrarModalExclusao(true);
  };

  const confirmarExclusao = async () => {
    try {
      await idosoService.remove(idosoSelecionado.id);
      const novosDados = idosos.filter(item => item.id !== idosoSelecionado.id);
      setIdosos(novosDados);
      setMostrarModalExclusao(false);
    } catch (error) {
      console.error('Erro ao excluir idoso:', error);
    }
  };

  const handleDarBaixa = async () => {
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
      <Lateral>
        <Container fluid className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <Alert variant="info">Carregando dados...</Alert>
        </Container>
      </Lateral>
    );
  }

  if (erroCarregamento) {
    return (
      <Lateral>
        <Container fluid className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <Alert variant="danger">{erroCarregamento}</Alert>
        </Container>
      </Lateral>
    );
  }

  return (
    <Lateral>
      <div className="content-area">
        <Container fluid>
          <Row className="mb-4 linha-cabecalho">
            <Col className="d-flex justify-content-between align-items-center">
              <h2>Lista de Idosos Cadastrados</h2>
              <div>
                <Button 
                  variant="primary"
                  onClick={() => navigate('/cadastro')}
                  aria-label="Cadastrar novo idoso"
                  className="me-2"
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
              </div>
            </Col>
          </Row>

          {idosos.length === 0 ? (
            <Alert variant="info">
              Nenhum idoso cadastrado. Clique em "Novo Idoso" para começar.
            </Alert>
          ) : (
            <>
              <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Filtros e Busca</h5>
                </Card.Header>
                <Card.Body className="collapse show" id="filtrosCollapse">
                  <Row>
                    <Col md={4} className="mb-3">
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
                    <Col md={4} className="mb-3">
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
                    <Col md={4} className="mb-3">
                      <Form.Label>Buscar</Form.Label>
                      <InputGroup>
                        <Form.Control 
                          type="text" 
                          placeholder="Nome, CPF ou cidade..."
                          value={termoBusca}
                          onChange={(e) => setTermoBusca(e.target.value)}
                          aria-label="Campo de busca"
                        />
                        <Button 
                          variant={termoBusca ? 'outline-danger' : 'outline-secondary'}
                          onClick={() => setTermoBusca('')}
                          title={termoBusca ? 'Limpar busca' : 'Buscar'}
                          aria-label={termoBusca ? 'Limpar busca' : 'Buscar'}
                        >
                          {termoBusca ? <X /> : <Search />}
                        </Button>
                      </InputGroup>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card>
                <Card.Body>
                  <div className="table-responsive">
                    {idososOrdenados.length === 0 ? (
                      <Alert variant="warning">
                        Nenhum idoso encontrado com os filtros atuais.
                      </Alert>
                    ) : (
                      <Table striped hover responsive>
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
                                <Badge 
                                  bg={idoso.status === 'internado' ? 'info' : 'secondary'}
                                  className="status-badge"
                                >
                                  {idoso.status === 'internado' ? 'Internado' : 'Não Internado'}
                                </Badge>
                              </td>
                              <td className="botoes-acao">
                                <Button 
                                  variant="outline-primary" 
                                  size="sm" 
                                  title="Editar"
                                  aria-label={`Editar ${idoso.nome}`}
                                  onClick={() => navigate(`/editar/${idoso.id}`)}
                                >
                                  <Pencil />
                                </Button>
                                
                                {/* Mostrar botão de internação OU botão de baixa */}
                                {idoso.status !== 'internado' ? (
                                  <Button 
                                    variant="outline-info" 
                                    size="sm" 
                                    title="Internação"
                                    aria-label={`Internação para ${idoso.nome}`}
                                    onClick={() => navigate('/internacoes?idosoId=' + idoso.id)}
                                  >
                                    <Building />
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="outline-warning" 
                                    size="sm" 
                                    title="Dar Baixa"
                                    aria-label={`Dar baixa para ${idoso.nome}`}
                                    onClick={() => {
                                      setIdosoSelecionado(idoso);
                                      setMostrarModalConfirmacao(true);
                                    }}
                                    className="me-1"
                                  >
                                    <BoxArrowRight />
                                  </Button>
                                )}
                                
                                <Button 
                                  variant="outline-danger" 
                                  size="sm" 
                                  title="Excluir"
                                  aria-label={`Excluir ${idoso.nome}`}
                                  onClick={() => handleExcluirClick(idoso)}
                                >
                                  <Trash />
                                </Button>
                                <Button 
                                  variant="outline-secondary" 
                                  size="sm" 
                                  title="Detalhes"
                                  aria-label={`Ver detalhes de ${idoso.nome}`}
                                  onClick={() => navigate(`/detalhes/${idoso.id}`)}
                                >
                                  <Eye />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </div>
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
              <Button variant="danger" onClick={confirmarExclusao}>
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
              <Button variant="warning" onClick={handleDarBaixa}>
                Confirmar Baixa
              </Button>
            </Modal.Footer>
          </Modal>

        </Container>
      </div>
    </Lateral>
  );
};

export default SataListaIdosos;