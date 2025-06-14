import { useEffect, useState } from "react";
import { Button, Form, Row, Col } from "react-bootstrap";

const QuartoForm = ({ onSave, onCancel, quartoAtual }) => {
  const [quarto, setQuarto] = useState({
    numero: "",
    tipo: "",
    leitos: 1,
    andar: "",
    observacao: "",
  });

  useEffect(() => {
    if (quartoAtual) {
      setQuarto(quartoAtual);
    }
  }, [quartoAtual]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setQuarto((prev) => ({
      ...prev,
      [name]: name === "leitos" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(quarto);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="numero">
            <Form.Label>Número do Quarto*</Form.Label>
            <Form.Control
              type="text"
              name="numero"
              value={quarto.numero}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="andar">
            <Form.Label>Andar*</Form.Label>
            <Form.Control
              as="select"
              name="andar"
              value={quarto.andar}
              onChange={handleChange}
              required
            >
              <option value="">Selecione</option>
              <option value="1">1º Andar</option>
              <option value="2">2º Andar</option>
              <option value="3">3º Andar</option>
            </Form.Control>
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="tipo">
            <Form.Label>Tipo de Quarto*</Form.Label>
            <Form.Control
              as="select"
              name="tipo"
              value={quarto.tipo}
              onChange={handleChange}
              required
            >
              <option value="">Selecione</option>
              <option value="Individual">Individual</option>
              <option value="Coletivo">Coletivo</option>
              <option value="Especial">Especial</option>
            </Form.Control>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="leitos">
            <Form.Label>Número de Leitos*</Form.Label>
            <Form.Control
              type="number"
              name="leitos"
              min="1"
              value={quarto.leitos}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col>
          <Form.Group controlId="observacao">
            <Form.Label>Descrição/Observações</Form.Label>
            <Form.Control
              as="textarea"
              name="observacao"
              value={quarto.observacao}
              onChange={handleChange}
              rows={2}
            />
          </Form.Group>
        </Col>
      </Row>

      <div className="d-flex justify-content-end">
        <Button variant="secondary" className="me-2" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="primary" type="submit">
          Salvar Quarto
        </Button>
      </div>
    </Form>
  );
};

export default QuartoForm;
