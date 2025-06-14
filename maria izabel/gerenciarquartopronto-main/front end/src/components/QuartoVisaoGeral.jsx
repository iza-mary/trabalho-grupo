import { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import { BiTrash, BiEditAlt } from "react-icons/bi";
import './QuartoGeral.css';

const QuartoVisaoGeral = ({ quartos = [], onDelete, onEdit }) => {
  const [paginaAtual, setPaginaAtual] = useState(1);
  const quartosPorPagina = 4;

  useEffect(() => {
    setPaginaAtual(1);
  }, [quartos]);

  // Ordenar os quartos por número
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
    <div className="quarto-box">
      <div className="quarto-titulo px-3 py-2 border-bottom bg-light">
        <h5 className="mb-0 fw-bold">Visão Geral dos Quartos</h5>
      </div>

      <div className="quarto-grid">
        {quartosPaginados.map((quarto) => (
          <div
            key={quarto.id}
            className={`quarto-card pequeno-card ${
              quarto.status === "Disponível" ? "status-bar-verde" : "status-bar-vermelha"
            }`}
          >
            <div className="quarto-info">
              <h6 className="fw-bold">Quarto {quarto.numero ?? "-"}</h6>
              <p><strong>Tipo:</strong> {quarto.tipo ?? "-"}</p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`quarto-badge ${
                    quarto.status === "Disponível" ? "status-disponivel" : "status-ocupado"
                  }`}
                >
                  {quarto.status ?? "-"}
                </span>
              </p>
              <p><strong>Leitos:</strong> {(quarto.ocupados ?? 0) + "/" + (quarto.leitos ?? "-")}</p>
            </div>
            <div className="quarto-actions d-flex gap-2 justify-content-end">
              <Button
                size="sm"
                variant="outline-primary"
                title="Editar"
                onClick={() => onEdit(quarto)}
              >
                <BiEditAlt />
              </Button>
              <Button
                size="sm"
                variant="outline-danger"
                title="Excluir"
                onClick={() => onDelete(quarto.id)}
              >
                <BiTrash />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {totalPaginas > 1 && (
        <div className="quarto-paginacao d-flex justify-content-center gap-2 mt-3">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={paginaAnterior}
            disabled={paginaAtual === 1}
          >
            &laquo; Anterior
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={proximaPagina}
            disabled={paginaAtual === totalPaginas}
          >
            Próxima &raquo;
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuartoVisaoGeral;
