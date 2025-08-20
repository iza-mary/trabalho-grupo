// components/Filter.jsx
import React, { useState } from "react";
import { Row, Col, Form, Button } from "react-bootstrap";

function Filter({ onFilter }) {
  const [filters, setFilters] = useState({ tipo: "", data: "" });

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter(filters);
  };

  const handleClear = () => {
    setFilters({ tipo: "", data: "" });
    onFilter({ tipo: "", data: "" });
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Filtrar por Tipo</Form.Label>
            <Form.Select 
              name="tipo" 
              value={filters.tipo} 
              onChange={handleChange}
            >
              <option value="">Todos os tipos</option>
              <option value="alimentação">Alimentação</option>
              <option value="saúde">Saúde</option>
              <option value="manutenção">Manutenção</option>
              <option value="outros">Outros</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Filtrar por Data</Form.Label>
            <Form.Control 
              type="date" 
              name="data" 
              value={filters.data} 
              onChange={handleChange} 
            />
          </Form.Group>
        </Col>
        <Col md={4} className="d-flex align-items-end">
          <Button type="submit" variant="primary" className="me-2">
            Aplicar Filtros
          </Button>
          <Button variant="outline-secondary" onClick={handleClear}>
            Limpar
          </Button>
        </Col>
      </Row>
    </Form>
  );
}

export default Filter;