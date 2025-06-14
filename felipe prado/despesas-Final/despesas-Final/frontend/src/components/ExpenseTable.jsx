import React from "react";

function ExpenseTable({ expenses, onDelete, onEdit }) {
  return (
    <div className="card shadow">
      <table className="table table-hover mb-0">
        <thead className="table-dark">
          <tr>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Tipo</th>
            <th>Data</th>
            <th>Observação</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e) => (
            <tr key={e.id}>
              <td>{e.descricao}</td>
              <td>R$ {parseFloat(e.valor).toFixed(2)}</td>
              <td>{e.tipo}</td>
              <td>
                {new Date(e.data).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                })}
              </td>
              <td>{e.observacao || "-"}</td>
              <td>
                <button
                  className="btn btn-sm btn-primary me-2"
                  onClick={() => onEdit(e)}
                >
                  Editar
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => onDelete(e.id)}
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ExpenseTable;
