// components/ExpenseTable.jsx
import React from "react";
import { Table, Button, Badge } from "react-bootstrap";
import { Pencil, Trash, Eye } from "react-bootstrap-icons";

function ExpenseTable({ expenses, onDelete, onEdit }) {
  const getBadgeVariant = (tipo) => {
    switch(tipo) {
      case 'alimentação': return 'primary';
      case 'saúde': return 'success';
      case 'manutenção': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <div className="table-responsive">
      <Table striped hover responsive>
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Valor (R$)</th>
            <th>Tipo</th>
            <th>Data</th>
            <th>Observação</th>
            <th className="text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e) => (
            <tr key={e.id}>
              <td>{e.descricao}</td>
              <td>R$ {parseFloat(e.valor).toFixed(2)}</td>
              <td>
                <Badge bg={getBadgeVariant(e.tipo)}>
                  {e.tipo}
                </Badge>
              </td>
              <td>
                {new Date(e.data).toLocaleDateString("pt-BR")}
              </td>
              <td>{e.observacao || "-"}</td>
              <td className="text-center">
                <div className="botoes-acao">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    title="Editar"
                    onClick={() => onEdit(e)}
                    className="me-1"
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    title="Excluir"
                    onClick={() => onDelete(e.id)}
                    className="me-1"
                  >
                    <Trash size={14} />
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    title="Detalhes"
                    onClick={() => console.log("Visualizar detalhes", e.id)}
                  >
                    <Eye size={14} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default ExpenseTable;