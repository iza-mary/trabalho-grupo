import React, { useState, useEffect } from "react";

function ExpenseForm({ expense, onAdd, onUpdate, onCancel }) {
  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    tipo: "",
    data: "",
    observacao: ""
  });

  // Atualiza o formulário quando a despesa para edição mudar
  useEffect(() => {
    if (expense) {
      setForm({
        descricao: expense.descricao || "",
        valor: expense.valor || "",
        tipo: expense.tipo || "",
        data: expense.data ? expense.data.slice(0, 10) : "", // formata yyyy-mm-dd
        observacao: expense.observacao || ""
      });
    } else {
      setForm({
        descricao: "",
        valor: "",
        tipo: "",
        data: "",
        observacao: ""
      });
    }
  }, [expense]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (expense) {
      // edição
      onUpdate({ ...expense, ...form });
    } else {
      // novo registro
      onAdd(form);
    }
    setForm({ descricao: "", valor: "", tipo: "", data: "", observacao: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 card p-3 shadow">
      <div className="row g-3">
        <div className="col-md-4">
          <input
            type="text"
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            className="form-control"
            placeholder="Descrição"
            required
          />
        </div>
        <div className="col-md-2">
          <input
            type="number"
            name="valor"
            value={form.valor}
            onChange={handleChange}
            className="form-control"
            placeholder="Valor"
            required
          />
        </div>
        <div className="col-md-2">
          <select
            name="tipo"
            value={form.tipo}
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="">Tipo</option>
            <option value="alimentação">Alimentação</option>
            <option value="saúde">Saúde</option>
            <option value="manutenção">Manutenção</option>
            <option value="outros">Outros</option>
          </select>
        </div>
        <div className="col-md-2">
          <input
            type="date"
            name="data"
            value={form.data}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>
        <div className="col-md-2">
          <input
            type="text"
            name="observacao"
            value={form.observacao}
            onChange={handleChange}
            className="form-control"
            placeholder="Observação"
          />
        </div>
        <div className="col-12 text-center">
          <button type="submit" className="btn btn-primary me-2">
            {expense ? "Salvar" : "Adicionar"}
          </button>
          {expense && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

export default ExpenseForm;
