import React, { useState } from 'react';
import { Form, Row, Col, InputGroup } from 'react-bootstrap';
import { Funnel } from 'react-bootstrap-icons';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

function FiltroBuscaDoadores({ onBuscar, onPesquisar }) {
  const [termo, setTermo] = useState('');
  const [tipo, setTipo] = useState(''); // '', 'pf', 'pj'
  const [ordemData, setOrdemData] = useState(''); // '', 'asc', 'desc'

  const atualizarBusca = (novoEstado) => {
    const estado = {
      tipo,
      ordemData,
      ...novoEstado,
    };
    onBuscar(estado);
  };

  const onChangeTermo = (e) => {
    const value = e.target.value;
    setTermo(value);
    const termos = value.toLowerCase().split(' ').filter(Boolean);
    onPesquisar?.(termos);
  };

  const onChangeTipo = (e) => {
    const value = e.target.value;
    setTipo(value);
    atualizarBusca({ tipo: value });
  };

  const onChangeOrdemData = (e) => {
    const value = e.target.value;
    setOrdemData(value);
    atualizarBusca({ ordemData: value });
  };

  return (
    <div className="mb-4 card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <span className="fw-semibold">Filtros e Busca</span>
        <button
          type="button"
          className="btn-sm btn btn-outline-secondary"
          data-bs-toggle="collapse"
          data-bs-target="#filtrosDoadoresCollapse"
          title="Mostrar/ocultar filtros"
        >
          <Funnel className="me-1" size={16} />
          Filtros
        </button>
      </div>
      <div className="collapse show card-body" id="filtrosDoadoresCollapse">
        <Form>
          <Row className="gy-2">
            <Col xs={12} md={6} lg={4}>
              <Form.Label>Tipo de Doador</Form.Label>
              <Form.Select value={tipo} onChange={onChangeTipo}>
                <option value="">Todos</option>
                <option value="pf">Pessoa Física</option>
                <option value="pj">Pessoa Jurídica</option>
              </Form.Select>
            </Col>

            <Col xs={12} md={6} lg={4}>
              <Form.Label>Ordenar por Data de Cadastro</Form.Label>
              <Form.Select value={ordemData} onChange={onChangeOrdemData}>
                <option value="">Sem ordenação</option>
                <option value="desc">Mais recentes</option>
                <option value="asc">Mais antigos</option>
              </Form.Select>
            </Col>

            <Col xs={12} md={12} lg={4}>
              <Form.Label>Busca</Form.Label>
              <InputGroup className="w-100">
                <Form.Control
                  type="text"
                  placeholder="Buscar..."
                  value={termo}
                  onChange={onChangeTermo}
                />
              </InputGroup>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
}

export default FiltroBuscaDoadores;
