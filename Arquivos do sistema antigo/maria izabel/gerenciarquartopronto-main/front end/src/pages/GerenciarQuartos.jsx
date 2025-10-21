import { useEffect, useState } from "react";
import { 
  Button, 
  Col, 
  Container, 
  Modal, 
  Row, 
  Alert, 
  Card, 
  Table,
  Form,
  InputGroup 
} from "react-bootstrap";
import { 
  Pencil, 
  Trash, 
  Eye, 
  PlusCircle, 
  Funnel, 
  Search, 
  X,
  Hospital
} from "react-bootstrap-icons";
import QuartoForm from "../components/QuartoForm";
import ModalExcluir from "../components/ModalExcluir";
import ModalDetalhes from "../components/ModalDetalhes";
import QuartoVisaoGeral from "../components/QuartoVisaoGeral";
import quartoService from "../services/quartoService";
import Lateral from "../components/Lateral";
import "./GerenciarQuartos.css";

const GerenciarQuartos = () => {
  const [quartos, setQuartos] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [idParaExcluir, setIdParaExcluir] = useState(null);
  const [mostrarModalExcluir, setMostrarModalExcluir] = useState(false);
  const [quartoEditando, setQuartoEditando] = useState(null);
  const [quartoSelecionado, setQuartoSelecionado] = useState(null);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [erroSalvar, setErroSalvar] = useState(null);
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroAndar, setFiltroAndar] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  useEffect(() => {
    const carregar = async () => {
      try {
        const dados = await quartoService.getAll();
        setQuartos(dados);
      } catch (error) {
        console.error("Erro ao carregar quartos:", error);
      }
    };
    carregar();
  }, []);

  const handleSalvar = async (quarto) => {
    try {
      setErroSalvar(null);

      if (quartoEditando) {
        const atualizado = await quartoService.update(quartoEditando.id, quarto);
        setQuartos((prev) =>
          prev.map((q) => (q.id === atualizado.id ? atualizado : q))
        );
      } else {
        const salvo = await quartoService.add(quarto);
        setQuartos((prev) => [...prev, salvo]);
      }

      setMostrarForm(false);
      setQuartoEditando(null);
    } catch (error) {
      console.error("Erro ao salvar quarto:", error);
      setErroSalvar(
        error.message || "Erro ao salvar quarto. Por favor, verifique os dados e tente novamente."
      );
    }
  };

  const handleEditar = (quarto) => {
    setQuartoEditando(quarto);
    setMostrarForm(true);
    setErroSalvar(null);
  };

  const handleConfirmarExclusao = (id) => {
    setIdParaExcluir(id);
    setMostrarModalExcluir(true);
  };

  const handleExcluir = async () => {
    try {
      await quartoService.remove(idParaExcluir);
      setQuartos((prev) => prev.filter((q) => q.id !== idParaExcluir));
      setMostrarModalExcluir(false);
      setIdParaExcluir(null);
    } catch (error) {
      console.error("Erro ao excluir quarto:", error);
    }
  };

  const handleView = (quarto) => {
    setQuartoSelecionado(quarto);
    setMostrarDetalhes(true);
  };

  const quartosFiltrados = quartos.filter(quarto => {
    const buscaMatch = quarto.numero.toString().toLowerCase().includes(termoBusca.toLowerCase());
    const tipoMatch = filtroTipo ? quarto.tipo === filtroTipo : true;
    const andarMatch = filtroAndar ? quarto.andar.toString() === filtroAndar : true;
    const statusMatch = filtroStatus ? quarto.status === filtroStatus : true;
    return buscaMatch && tipoMatch && andarMatch && statusMatch;
  });

  return (
    <Lateral>
      <div className="content-area">
        <Container fluid>
          <Row className="mb-4 linha-cabecalho">
            <Col className="d-flex justify-content-between align-items-center">
              <h2>Lista de Quartos Cadastrados</h2>
              <Button
                variant="primary"
                onClick={() => {
                  setQuartoEditando(null);
                  setMostrarForm(true);
                  setErroSalvar(null);
                }}
              >
                <PlusCircle className="me-1" /> Adicionar Quarto
              </Button>
            </Col>
          </Row>

          {/* Visão Geral dos Quartos */}
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <Hospital className="me-2" /> Visão Geral dos Quartos
              </h5>
            </Card.Header>
            <Card.Body>
              <QuartoVisaoGeral
                quartos={quartos}
                onDelete={handleConfirmarExclusao}
                onEdit={handleEditar}
                onView={handleView}
              />
            </Card.Body>
          </Card>

          {/* Filtros e Lista */}
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Filtros e Busca</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4} className="mb-3">
                  <Form.Label>Tipo</Form.Label>
                  <Form.Select
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="Individual">Individual</option>
                    <option value="Coletivo">Coletivo</option>
                    <option value="Especial">Especial</option>
                  </Form.Select>
                </Col>
                <Col md={4} className="mb-3">
                  <Form.Label>Andar</Form.Label>
                  <Form.Select
                    value={filtroAndar}
                    onChange={(e) => setFiltroAndar(e.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="1">1º Andar</option>
                    <option value="2">2º Andar</option>
                    <option value="3">3º Andar</option>
                  </Form.Select>
                </Col>
                <Col md={4} className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="Disponível">Disponível</option>
                    <option value="Ocupado">Ocupado</option>
                  </Form.Select>
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <Form.Label>Buscar</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Número do quarto..."
                      value={termoBusca}
                      onChange={(e) => setTermoBusca(e.target.value)}
                    />
                    <Button
                      variant={termoBusca ? 'outline-danger' : 'outline-secondary'}
                      onClick={() => setTermoBusca('')}
                    >
                      {termoBusca ? <X /> : <Search />}
                    </Button>
                  </InputGroup>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Lista Detalhada */}
          <Card>
            <Card.Body>
              <div className="table-responsive">
                {quartosFiltrados.length === 0 ? (
                  <Alert variant="warning">
                    Nenhum quarto encontrado com os filtros atuais.
                  </Alert>
                ) : (
                  <Table striped hover responsive>
                    <thead>
                      <tr>
                        <th>Número</th>
                        <th>Tipo</th>
                        <th>Leitos</th>
                        <th>Ocupação</th>
                        <th>Status</th>
                        <th>Andar</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quartosFiltrados.map((quarto) => (
                        <tr key={quarto.id}>
                          <td>{quarto.numero}</td>
                          <td>{quarto.tipo}</td>
                          <td>{quarto.leitos}</td>
                          <td>{`${quarto.ocupados || 0}/${quarto.leitos}`}</td>
                          <td>
                            <span className={`badge ${quarto.status === "Disponível" ? "bg-success" : "bg-danger"}`}>
                              {quarto.status}
                            </span>
                          </td>
                          <td>{quarto.andar}º</td>
                          <td className="botoes-acao">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              title="Editar"
                              onClick={() => handleEditar(quarto)}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              title="Excluir"
                              onClick={() => handleConfirmarExclusao(quarto.id)}
                            >
                              <Trash />
                            </Button>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              title="Detalhes"
                              onClick={() => handleView(quarto)}
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

          {/* Modais */}
          <Modal
            show={mostrarForm}
            onHide={() => {
              setMostrarForm(false);
              setQuartoEditando(null);
              setErroSalvar(null);
            }}
            centered
            size="lg"
          >
            <Modal.Header closeButton>
              <Modal.Title>
                {quartoEditando ? "Editar Quarto" : "Adicionar Novo Quarto"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {erroSalvar && (
                <Alert variant="danger" className="mb-3">
                  {erroSalvar}
                </Alert>
              )}
              <QuartoForm
                onSave={handleSalvar}
                onCancel={() => {
                  setMostrarForm(false);
                  setQuartoEditando(null);
                  setErroSalvar(null);
                }}
                quartoAtual={quartoEditando}
              />
            </Modal.Body>
          </Modal>

          <ModalExcluir
            show={mostrarModalExcluir}
            onHide={() => setMostrarModalExcluir(false)}
            onConfirm={handleExcluir}
          />

          <ModalDetalhes
            show={mostrarDetalhes}
            onHide={() => setMostrarDetalhes(false)}
            quarto={quartoSelecionado}
          />
        </Container>
      </div>
    </Lateral>
  );
};

export default GerenciarQuartos;