import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { FileEarmarkText, HouseDoor } from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PageHeader from '../components/ui/PageHeader';
import { quartoService } from '../services/quartoService';
import './SataQuartos.css';

const initialState = {
  numero: '',
  capacidade: '',
  descricao: '',
};

const SataCadastroQuartos = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const estaEditando = !!id;

  const [formData, setFormData] = useState(initialState);
  const [erros, setErros] = useState({});
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState(null);

  useEffect(() => {
    const carregar = async () => {
      if (!estaEditando) return;
      setCarregando(true);
      try {
        const result = await quartoService.getById(id);
        const quarto = result?.data;
        if (quarto) {
          setFormData({
            numero: String(quarto.numero || ''),
            capacidade: String(quarto.capacidade || ''),
            descricao: quarto.descricao || '',
          });
        }
      } catch (e) {
        console.error('Erro ao carregar quarto:', e);
        setErroCarregamento(e?.message || 'Erro ao carregar dados do quarto');
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, [estaEditando, id]);

  const validate = () => {
    const errs = {};
    if (!formData.numero || String(formData.numero).trim().length === 0) {
      errs.numero = 'Número do quarto é obrigatório';
    }
    const cap = parseInt(formData.capacidade, 10);
    if (!cap || cap <= 0) {
      errs.capacidade = 'Capacidade deve ser maior que zero';
    }
    return errs;
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErros(errs);
    if (Object.keys(errs).length > 0) return;
    setSalvando(true);
    try {
      const basePayload = {
        numero: String(formData.numero).trim(),
        capacidade: parseInt(formData.capacidade, 10),
        descricao: formData.descricao || null,
      };
      if (estaEditando) {
        const payloadUpdate = { ...basePayload };
        await quartoService.update(id, payloadUpdate);
        alert('Quarto atualizado com sucesso!');
      } else {
        // Não permitir alteração manual do status na criação
        const payloadCreate = { ...basePayload };
        await quartoService.create(payloadCreate);
        alert('Quarto criado com sucesso!');
      }
      navigate('/quartos');
    } catch (e) {
      console.error('Erro ao salvar quarto:', e);
      alert(e?.message || 'Erro ao salvar quarto');
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <Navbar>
        <Container fluid className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <Spinner animation="border" variant="primary" />
        </Container>
      </Navbar>
    );
  }

  return (
    <Navbar>
      <div className="content-area full-main">
        <Container fluid>
          <PageHeader
            title={estaEditando ? 'Editar Quarto' : 'Cadastro de Quarto'}
            icon={!estaEditando ? <FileEarmarkText /> : <HouseDoor />}
            actions={
              <Button variant="secondary" onClick={() => navigate('/quartos')}>Voltar</Button>
            }
          />

          {erroCarregamento && (
            <Alert variant="danger">{erroCarregamento}</Alert>
          )}

          <Card>
            <Card.Header>
              <h5 className="mb-0">Dados do Quarto</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={onSubmit} noValidate>
                <Row>
                  <Col md={4} className="mb-3">
                    <Form.Label>Número</Form.Label>
                    <Form.Control
                      name="numero"
                      value={formData.numero}
                      onChange={onChange}
                      isInvalid={!!erros.numero}
                      placeholder="Ex.: 101"
                      required
                    />
                    <Form.Control.Feedback type="invalid">{erros.numero}</Form.Control.Feedback>
                  </Col>
                  <Col md={4} className="mb-3">
                    <Form.Label>Capacidade</Form.Label>
                    <Form.Control
                      name="capacidade"
                      type="number"
                      min={1}
                      value={formData.capacidade}
                      onChange={onChange}
                      isInvalid={!!erros.capacidade}
                      placeholder="Ex.: 4"
                      required
                    />
                    <Form.Control.Feedback type="invalid">{erros.capacidade}</Form.Control.Feedback>
                  </Col>
                  {/* Status não editável: campo removido para padronizar com cadastro e impossibilitar alteração manual */}
                </Row>

                <Row>
                  <Col md={12} className="mb-3">
                    <Form.Label>Descrição</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="descricao"
                      value={formData.descricao}
                      onChange={onChange}
                      placeholder="Observações sobre o quarto, localização, etc."
                    />
                  </Col>
                </Row>

                <div className="d-flex justify-content-end">
                  <Button type="submit" variant="primary" disabled={salvando}>
                    {estaEditando ? 'Salvar Alterações' : 'Cadastrar Quarto'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Container>
      </div>
    </Navbar>
  );
};

export default SataCadastroQuartos;