import { useState, useEffect } from "react";
import { Button, Card } from "react-bootstrap";
import { Pencil, Trash, Eye } from "react-bootstrap-icons";
import "../pages/GerenciarQuartos.css";

const QuartoVisaoGeral = ({ quartos = [], onDelete, onEdit, onView }) => {
  const [paginaAtual, setPaginaAtual] = useState(1);
  const quartosPorPagina = 4;

  useEffect(() => {
    setPaginaAtual(1);
  }, [quartos]);

  const quartosOrdenados = [...quartos].sort((a, b) => a.numero - b.numero);
  const totalPaginas = Math.ceil(quartosOrdenados.length / quartosPorPagina);
  const inicio = (paginaAtual - 1) * quartosPorPagina;
  const quartosPaginados = quartosOrdenados.slice(inicio, inicio + quartosPorPagina);

  const proximaPagina = () => {
    if (paginaAtual < totalPaginas) {
      setPaginaAtual(paginaAtual + 1);
    }
  };

  const paginaAnterior = () => {
    if (paginaAtual > 1) {
      setPaginaAtual(paginaAtual - 1);
    }
  };

  return (
    <div className="quarto-visao-container">
      <div className="quarto-grid">
        {quartosPaginados.map((quarto) => (
          <Card key={quarto.id} className="mb-3 me-3" style={{ minWidth: '280px' }}>
            <Card.Body className={`${quarto.status === "Disponível" ? "border-start border-success border-4" : "border-start border-danger border-4"}`}>
              <Card.Title>Quarto {quarto.numero ?? "-"}</Card.Title>
              <Card.Text>
                <strong>Tipo:</strong> {quarto.tipo ?? "-"}<br />
                {" "}
                <span className={`badge ${quarto.status === "Disponível" ? "bg-success" : "bg-danger"}`}>
                  {quarto.status ?? "-"}
                </span><br />
                <strong>Leitos:</strong> {(quarto.ocupados ?? 0)}/{quarto.leitos ?? "-"}<br />
                <strong>Andar:</strong> {quarto.andar ?? "-"}º
              </Card.Text>
              <div className="botoes-acao">
                <Button
                  variant="outline-primary"
                  size="sm"
                  title="Editar"
                  onClick={() => onEdit(quarto)}
                  className="me-2"
                >
                  <Pencil />
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  title="Excluir"
                  onClick={() => onDelete(quarto.id)}
                  className="me-2"
                >
                  <Trash />
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  title="Detalhes"
                  onClick={() => onView(quarto)}
                >
                  <Eye />
                </Button>
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>

      {totalPaginas > 1 && (
        <div className="d-flex justify-content-center mt-3">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={paginaAnterior}
            disabled={paginaAtual === 1}
            className="me-2"
          >
            Anterior
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={proximaPagina}
            disabled={paginaAtual === totalPaginas}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuartoVisaoGeral;