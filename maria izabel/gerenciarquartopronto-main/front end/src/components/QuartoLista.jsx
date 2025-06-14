import { useState, useMemo, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Form,
  InputGroup,
  Dropdown,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import "./QuartoLista.css";

const QuartoLista = ({ quartos, onDelete, onEdit, onView }) => {
  const [busca, setBusca] = useState("");
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroAndar, setFiltroAndar] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const quartosPorPagina = 5;

  useEffect(() => {
    setPaginaAtual(1);
  }, [quartos]);

  const toggleFiltros = () => setFiltrosVisiveis(!filtrosVisiveis);

  const quartosFiltrados = useMemo(() => {
    return [...quartos]
      .filter((quarto) => {
        const buscaMatch = quarto.numero.toString().includes(busca);
        const tipoMatch = filtroTipo ? quarto.tipo === filtroTipo : true;
        const andarMatch = filtroAndar ? quarto.andar.toString() === filtroAndar : true;
        const statusMatch = filtroStatus ? quarto.status === filtroStatus : true;
        return buscaMatch && tipoMatch && andarMatch && statusMatch;
      })
      .sort((a, b) => a.numero - b.numero);
  }, [quartos, busca, filtroTipo, filtroAndar, filtroStatus]);

  const totalPaginas = Math.ceil(quartosFiltrados.length / quartosPorPagina);
  const quartosPaginados = quartosFiltrados.slice(
    (paginaAtual - 1) * quartosPorPagina,
    paginaAtual * quartosPorPagina
  );

  return (
    <Card className="shadow-sm border-0">
      <Card.Header className="bg-light d-flex justify-content-between align-items-center">
        <h5 className="fw-bold mb-0">Lista Detalhada de Quartos</h5>
        <div className="d-flex gap-2 align-items-center flex-wrap">
          <Form.Label className="mb-0 me-1">Pesquisar</Form.Label>
          <InputGroup size="sm" style={{ maxWidth: "280px" }}>
            <Form.Control
              placeholder="Buscar número do quarto"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <Dropdown show={filtrosVisiveis} onToggle={toggleFiltros} align="end">
              <Dropdown.Toggle
                variant="outline-secondary"
                size="sm"
                style={{
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                  borderLeft: "0",
                }}
              >
                <i className="bi bi-funnel-fill"></i>
              </Dropdown.Toggle>
              <Dropdown.Menu className="dropdown-filter p-3">
                <Form.Select
                  size="sm"
                  className="mb-2"
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                >
                  <option value="">Tipo de Quarto</option>
                  <option value="Individual">Individual</option>
                  <option value="Coletivo">Coletivo</option>
                  <option value="Especial">Especial</option>
                </Form.Select>
                <Form.Select
                  size="sm"
                  className="mb-2"
                  value={filtroAndar}
                  onChange={(e) => setFiltroAndar(e.target.value)}
                >
                  <option value="">Andar</option>
                  <option value="1">1º Andar</option>
                  <option value="2">2º Andar</option>
                  <option value="3">3º Andar</option>
                </Form.Select>
                <Form.Select
                  size="sm"
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                >
                  <option value="">Status</option>
                  <option value="Disponível">Disponível</option>
                  <option value="Ocupado">Ocupado</option>
                </Form.Select>

                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="mt-2 w-100"
                  onClick={() => {
                    setFiltroTipo("");
                    setFiltroAndar("");
                    setFiltroStatus("");
                  }}
                >
                  Limpar Filtros
                </Button>
              </Dropdown.Menu>
            </Dropdown>
          </InputGroup>
        </div>
      </Card.Header>

      <Card.Body>
        {quartosFiltrados.length === 0 ? (
          <div className="text-center p-5">
            <p className="text-muted fs-5">Nenhum quarto encontrado.</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <Table className="align-middle text-center table-striped custom-table">
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
                  {quartosPaginados.map((quarto) => (
                    <tr key={quarto.id}>
                      <td>{quarto.numero}</td>
                      <td>
                        <span className="badge bg-light text-dark border fw-semibold">
                          {quarto.tipo}
                        </span>
                      </td>
                      <td>{quarto.leitos}</td>
                      <td>{`${quarto.ocupacao ?? 0}/${quarto.leitos}`}</td>
                      <td>
                        <span
                          className={`badge fw-semibold px-2 py-1 rounded-pill ${
                            quarto.status === "Disponível"
                              ? "bg-success-subtle text-success"
                              : "bg-danger-subtle text-danger"
                          }`}
                        >
                          {quarto.status}
                        </span>
                      </td>
                      <td>{`${quarto.andar}º`}</td>
                      <td className="d-flex justify-content-center gap-2">
                        <OverlayTrigger placement="top" overlay={<Tooltip>Editar</Tooltip>}>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            className="icon-btn"
                            onClick={() => onEdit(quarto)}
                          >
                            <i className="bi bi-pencil-square"></i>
                          </Button>
                        </OverlayTrigger>
                        <OverlayTrigger placement="top" overlay={<Tooltip>Excluir</Tooltip>}>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            className="icon-btn"
                            onClick={() => onDelete(quarto.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </OverlayTrigger>
                        <OverlayTrigger placement="top" overlay={<Tooltip>Detalhes</Tooltip>}>
                          <Button
                            size="sm"
                            variant="outline-info"
                            className="icon-btn"
                            onClick={() => onView(quarto)}
                          >
                            <i className="bi bi-info-circle"></i>
                          </Button>
                        </OverlayTrigger>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3 px-2">
              <small className="text-muted">
                Página {paginaAtual} de {totalPaginas}
              </small>
              <nav>
                <ul className="pagination mb-0">
                  <li className={`page-item ${paginaAtual === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
                    >
                      Anterior
                    </button>
                  </li>

                  {Array.from({ length: totalPaginas }, (_, i) => (
                    <li
                      key={i}
                      className={`page-item ${paginaAtual === i + 1 ? "active" : ""}`}
                    >
                      <button className="page-link" onClick={() => setPaginaAtual(i + 1)}>
                        {i + 1}
                      </button>
                    </li>
                  ))}

                  <li className={`page-item ${paginaAtual === totalPaginas ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() =>
                        setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))
                      }
                    >
                      Próximo
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default QuartoLista;
