// components/Filter.jsx
import React, { useState, useEffect } from "react";
import { Row, Col, Form, InputGroup, Button } from "react-bootstrap";
import { Search, X } from "react-bootstrap-icons";

function Filter({ onFilter }) {
  const [filters, setFilters] = useState({ 
    tipo: "", 
    data: "", 
    pesquisa: "" 
  });

  useEffect(() => {
    onFilter(filters);
  }, [filters, onFilter]);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleClearSearch = () => {
    setFilters({ ...filters, pesquisa: "" });
  };

  return (
    <Form>
      <Row>
        <Col md={3}>
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
        <Col md={3}>
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
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Pesquisar</Form.Label>
            <InputGroup>
              <Form.Control 
                type="text" 
                name="pesquisa" 
                value={filters.pesquisa} 
                onChange={handleChange}
                placeholder="Pesquisar por descrição ou observação..." 
                style={{ fontSize: '0.9rem' }}
              />
              {filters.pesquisa && (
                <Button 
                  variant="outline-secondary" 
                  onClick={handleClearSearch}
                  title="Limpar pesquisa"
                >
                  <X size={14} />
                </Button>
              )}
              <Button 
                variant="outline-primary" 
                title="Pesquisar"
                disabled
              >
                <Search size={14} />
              </Button>
            </InputGroup>
          </Form.Group>
        </Col>
      </Row>
    </Form>
  );
}

export default Filter;