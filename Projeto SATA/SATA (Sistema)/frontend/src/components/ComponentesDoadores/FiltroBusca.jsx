import React, { useState } from 'react';
import { Card, InputGroup, Form } from 'react-bootstrap';
import './SataDoadores.css';

function FiltroBusca({ setTermos }) {
  const [termoBusca, setTermoBusca] = useState('');

  const handleFiltrar = (e) => {
    const value = e.target.value;
    setTermoBusca(value);
    const termos = value.toLowerCase().split(' ').filter(Boolean);
    setTermos(termos);
  };

  return (
    <Card className="mb-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <span className="fw-semibold">Filtros</span>
        <InputGroup style={{ maxWidth: 360 }}>
          <Form.Control
            type="text"
            placeholder="Buscar doadores..."
            value={termoBusca}
            onChange={handleFiltrar}
          />
        </InputGroup>
      </Card.Header>
    </Card>
  );
}

export default FiltroBusca;