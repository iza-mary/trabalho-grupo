import React, { useEffect, useState } from "react";
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ExpenseForm from './components/ExpenseForm.jsx';
import ExpenseTable from './components/ExpenseTable.jsx';
import Filter from './components/Filter.jsx';
import api from "./services/api";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [expenses, setExpenses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [editingExpense, setEditingExpense] = useState(null);

  const fetchExpenses = async () => {
    const response = await api.get("/despesas");
    setExpenses(response.data);
    setFiltered(response.data);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const addExpense = async (expense) => {
    await api.post("/despesas", expense);
    fetchExpenses();
  };

  const updateExpense = async (expense) => {
    await api.put(`/despesas/${expense.id}`, expense);
    setEditingExpense(null);
    fetchExpenses();
  };

  const deleteExpense = async (id) => {
    await api.delete(`/despesas/${id}`);
    fetchExpenses();
  };

const handleFilter = ({ tipo, data }) => {
  let dataFiltrada = [...expenses];

  if (tipo) dataFiltrada = dataFiltrada.filter(e => e.tipo === tipo);

  if (data) {
    dataFiltrada = dataFiltrada.filter(e => {
      const eData = new Date(e.data);
      // extrai string no formato yyyy-mm-dd para comparação
      const eDataStr = eData.toISOString().slice(0, 10);
      return eDataStr === data;
    });
  }

  setFiltered(dataFiltrada);
};


  // Ação chamada ao clicar no botão editar da tabela
  const handleEdit = (expense) => {
    setEditingExpense(expense);
  };

  // Cancelar edição
  const handleCancelEdit = () => {
    setEditingExpense(null);
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="flex-fill container my-4">
        <h2 className="mb-4">Gerenciar Despesas</h2>
        <ExpenseForm
          onAdd={addExpense}
          onUpdate={updateExpense}
          expense={editingExpense}
          onCancel={handleCancelEdit}
        />
        <Filter onFilter={handleFilter} />
        <ExpenseTable
          expenses={filtered}
          onDelete={deleteExpense}
          onEdit={handleEdit} // passa a função para o ExpenseTable
        />
      </main>
      <Footer />
    </div>
  );
}

export default App;
