import React, { useState } from 'react';
import {
  Button,
  Card,
  Alert,
  Modal
} from 'react-bootstrap';
import StandardTable from '../ui/StandardTable';
import {
  Pencil,
  Trash,
  } from 'react-bootstrap-icons';
import './SataDoadores.css';

function TabelaDoadores({
  ativaModal,
  doadores,
  setDoadorEditar,
  onDelete,
  handleDeletar
}) {
  const [deletar, setDeletar] = useState(false);
  const formatDate = (raw) => {
    if (!raw) return '-';
    try {
      const d = typeof raw === 'string' ? new Date(raw) : raw;
      if (!d || isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  };
  

  return (
    <>
      <Card>
        <Card.Body>
          <div className="table-responsive">
            {doadores.length === 0 ? (
              <Alert variant="info" className="mb-0">
                Nenhum doador encontrado
              </Alert>
            ) : (
              <StandardTable>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>CPF</th>
                    <th>Telefone</th>
                    <th>Cadastro</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {doadores.map((doador) => (
                    <tr key={doador.id}>
                      <td>{doador.nome}</td>
                      <td>{doador.cpf || "-"}</td>
                      <td>{doador.telefone || "-"}</td>
                      <td>{formatDate(doador.dataCadastro ?? doador.data_cadastro)}</td>
                      <td>
                        <div className="botoes-acao">
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </StandardTable>
            )}
          </div>
        </Card.Body>
      </Card>

      <Modal show={deletar} onHide={() => setDeletar(false)} centered>
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
    </>
  );
}

export default TabelaDoadores;