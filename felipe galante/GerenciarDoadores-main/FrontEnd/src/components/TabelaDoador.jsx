import React, { useState } from 'react';
import {
  Button,
  Card,
  Table,
  Badge,
  Alert,
  InputGroup,
  Form,
  Modal
} from 'react-bootstrap';
import {
  Pencil,
  Trash,
  Search,
  X
} from 'react-bootstrap-icons';
import './SataDoadores.css';
import './tabelaDoadores.css';

function TabelaDoadores({
  ativaModal,
  doadores,
  setDoadorEditar,
  onDelete,
  handleDeletar,
  setTermos
}) {
  const [deletar, setDeletar] = useState(false);
  const [termoBusca, setTermoBusca] = useState("");

  const handleFiltrar = (e) => {
    const value = e.target.value;
    setTermoBusca(value);
    const termos = value.toLowerCase().split(" ").filter(Boolean);
    setTermos(termos);
  };

  return (
    <div className="content-area container">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4>Lista de Doadores</h4>
          <InputGroup style={{ width: '300px' }}>
            <Form.Control
              type="text"
              placeholder="Buscar doadores..."
              value={termoBusca}
              onChange={handleFiltrar}
            />
            <Button
              variant={termoBusca ? 'outline-danger' : 'outline-secondary'}
              onClick={() => { setTermoBusca(''); setTermos([]); }}
            >
              {termoBusca ? <X /> : <Search />}
            </Button>
          </InputGroup>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            {doadores.length === 0 ? (
              <Alert variant="info">
                Nenhum doador encontrado
              </Alert>
            ) : (
              <Table striped hover responsive>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>CPF</th>
                    <th>Telefone</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {doadores.map((doador) => (
                    <tr key={doador.id}>
                      <td>{doador.nome}</td>
                      <td>{doador.cpf || "-"}</td>
                      <td>{doador.telefone || "-"}</td>
                      <td>
                        <Badge bg={doador.ativo ? 'success' : 'secondary'}>
                          {doador.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="botoes-acao">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          title="Editar"
                          onClick={() => { 
                            ativaModal(true); 
                            setDoadorEditar(doador); 
                          }}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          title="Excluir"
                          onClick={() => { 
                            setDeletar(true); 
                            handleDeletar(doador); 
                          }}
                        >
                          <Trash />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </Card.Body>
      </Card>

      <Modal show={deletar} onHide={() => setDeletar(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Tem certeza que deseja excluir este doador? Esta ação não pode ser desfeita.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeletar(false)}>
            Cancelar
          </Button>
          <Button 
            variant="danger" 
            onClick={() => { 
              onDelete(); 
              setDeletar(false); 
            }}
          >
            Excluir
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default TabelaDoadores;