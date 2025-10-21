import React, { useEffect, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import Lateral from './components/Lateral';
import ExpenseForm from './components/ExpenseForm';
import ExpenseTable from './components/ExpenseTable';
import Filter from './components/Filter';
import api from "./services/api";
import "bootstrap/dist/css/bootstrap.min.css";
import './App.css';

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

  const handleFilter = ({ tipo, data, pesquisa }) => {
    let dataFiltrada = [...expenses];

    if (tipo) dataFiltrada = dataFiltrada.filter(e => e.tipo === tipo);

    if (data) {
      dataFiltrada = dataFiltrada.filter(e => {
        const eData = new Date(e.data);
        const eDataStr = eData.toISOString().slice(0, 10);
        return eDataStr === data;
      });
    }

    if (pesquisa) {
      const termoPesquisa = pesquisa.toLowerCase();
      dataFiltrada = dataFiltrada.filter(e => 
        e.descricao.toLowerCase().includes(termoPesquisa) || 
        (e.observacao && e.observacao.toLowerCase().includes(termoPesquisa))
      );
    }

    setFiltered(dataFiltrada);
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
  };

  return (
    <Router>
      <Lateral>
        <div className="content-area">
          <div className="container-fluid">
            <div className="row mb-4 linha-cabecalho">
              <div className="col d-flex justify-content-between align-items-center">
                <h2 className="mb-0">Gerenciamento de Despesas</h2>
              </div>
            </div>

            <div className="row">
              <div className="col-12">
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">Registrar Despesa</h5>
                  </div>
                  <div className="card-body">
                    <ExpenseForm
                      onAdd={addExpense}
                      onUpdate={updateExpense}
                      expense={editingExpense}
                      onCancel={handleCancelEdit}
                    />
                  </div>
                </div>

                <div className="card mb-4">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Filtros</h5>
                  </div>
                  <div className="card-body">
                    <Filter onFilter={handleFilter} />
                  </div>
                </div>

                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Lista de Despesas</h5>
                  </div>
                  <div className="card-body">
                    <ExpenseTable
                      expenses={filtered}
                      onDelete={deleteExpense}
                      onEdit={handleEdit}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Lateral>
    </Router>
  );
}

export default App;