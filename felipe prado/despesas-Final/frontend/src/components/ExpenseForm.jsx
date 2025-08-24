// components/ExpenseForm.jsx
import React, { useState, useEffect } from "react";
import { Row, Col, Form, Button } from "react-bootstrap";

function ExpenseForm({ expense, onAdd, onUpdate, onCancel }) {
  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    tipo: "",
    data: "",
    observacao: ""
  });

  useEffect(() => {
    if (expense) {
      setForm({
        descricao: expense.descricao || "",
        valor: expense.valor || "",
        tipo: expense.tipo || "",
        data: expense.data ? expense.data.slice(0, 10) : "",
        observacao: expense.observacao || ""
      });
    } else {
      clearForm();
    }
  }, [expense]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (expense) {
      onUpdate({ ...expense, ...form });
    } else {
      onAdd(form);
    }
    clearForm();
  };

  const clearForm = () => {
    setForm({
      descricao: "",
      valor: "",
      tipo: "",
      data: "",
      observacao: ""
    });
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Descrição</Form.Label>
            <Form.Control
              type="text"
              name="descricao"
              value={form.descricao}
              onChange={handleChange}
              placeholder="Descrição da despesa"
              required
            />
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group className="mb-3">
            <Form.Label>Valor (R$)</Form.Label>
            <Form.Control
              type="number"
              name="valor"
              value={form.valor}
              onChange={handleChange}
              placeholder="0,00"
              step="0.01"
              required
            />
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group className="mb-3">
            <Form.Label>Tipo</Form.Label>
            <Form.Select
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
              required
            >
              <option value="">Selecione</option>
              <option value="alimentação">Alimentação</option>
              <option value="saúde">Saúde</option>
              <option value="manutenção">Manutenção</option>
              <option value="outros">Outros</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group className="mb-3">
            <Form.Label>Data</Form.Label>
            <Form.Control
              type="date"
              name="data"
              value={form.data}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Col>
      </Row>
      
      <Row>
        <Col md={10}>
          <Form.Group className="mb-3">
            <Form.Label>Observação</Form.Label>
            <Form.Control
              type="text"
              name="observacao"
              value={form.observacao}
              onChange={handleChange}
              placeholder="Observações adicionais sobre a despesa"
            />
          </Form.Group>
        </Col>
        <Col md={2} className="d-flex align-items-end">
          <Form.Group className="mb-3 w-100">
            <Button 
              variant="outline-secondary" 
              onClick={clearForm}
              className="w-100"
              type="button"
            >
              Limpar
            </Button>
          </Form.Group>
        </Col>
      </Row>
      
      <div className="d-flex justify-content-end">
        {expense && (
          <Button 
            variant="outline-secondary" 
            onClick={onCancel}
            className="me-2"
          >
            Cancelar
          </Button>
        )}
        <Button variant="primary" type="submit">
          {expense ? "Salvar Alterações" : "Adicionar Despesa"}
        </Button>
      </div>
    </Form>
  );
}

export default ExpenseForm;