import React from 'react';

function ExpenseList({ despesas, onDelete }) {
  return (
    <div className="card p-4 mt-4 shadow-sm">
      <h5>Lista de Despesas</h5>
      <ul className="list-group">
        {despesas.map((despesa, index) => (
          <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
            {despesa.descricao} — R$ {despesa.valor.toFixed(2)}
            <button onClick={() => onDelete(index)} className="btn btn-sm btn-danger">Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ExpenseList;
