import React, { useState } from "react";

function Filter({ onFilter }) {
  const [filters, setFilters] = useState({ tipo: "", data: "" });

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter(filters);
  };

  return (
    <form onSubmit={handleSubmit} className="card p-3 shadow mb-4">
      <div className="row g-3 align-items-end">
        <div className="col-md-4">
          <select name="tipo" value={filters.tipo} onChange={handleChange} className="form-select">
            <option value="">Filtrar por Tipo</option>
            <option value="alimentação">Alimentação</option>
            <option value="saúde">Saúde</option>
            <option value="manutenção">Manutenção</option>
            <option value="outros">Outros</option>
          </select>
        </div>
        <div className="col-md-4">
          <input type="date" name="data" value={filters.data} onChange={handleChange} className="form-control" />
        </div>
        <div className="col-md-4 text-end">
          <button className="btn btn-secondary">Filtrar</button>
        </div>
      </div>
    </form>
  );
}

export default Filter;
