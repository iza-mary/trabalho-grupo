import { useState } from "react";
import { Button, Alert, Card, Modal } from "react-bootstrap";
import { Pencil, Trash } from "react-bootstrap-icons";
import StandardTable from "../ui/StandardTable";
import { formatDate } from "../../utils/dateUtils";
import { useAuth } from '../../hooks/useAuth';
import { formatarCPF, formatarCNPJ, validarCPF, validarCNPJ } from '../../pages/validacoes';

function TabelaDoadores({ doadores, ativaModal, setDoadorEditar, onDelete, handleDeletar }) {
  const [deletar, setDeletar] = useState(false);
  const { isAdmin } = useAuth();

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
                    <th>CPF/CNPJ</th>
                    <th>Telefone</th>
                    <th>Cadastro</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {doadores.map((doador) => (
                    <tr key={doador.id}>
                      <td>{doador.nome}</td>
                      <td>{renderDocumento(doador)}</td>
                      <td>{doador.telefone || "-"}</td>
                      <td>{formatDate(doador.dataCadastro ?? doador.data_cadastro)}</td>
                      <td>
                        <div className="botoes-acao">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            title={!isAdmin ? 'Apenas Administradores podem editar' : 'Editar'}
                            disabled={!isAdmin}
                            className={`me-1 ${!isAdmin ? 'disabled-action' : ''}`}
                            onClick={!isAdmin ? undefined : () => { 
                              ativaModal(true); 
                              setDoadorEditar(doador); 
                            }}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            title={!isAdmin ? 'Apenas Administradores podem excluir' : 'Excluir'}
                            disabled={!isAdmin}
                            className={`${!isAdmin ? 'disabled-action' : ''}`}
                            onClick={!isAdmin ? undefined : () => { 
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

      <Modal show={deletar} onHide={() => setDeletar(false)} dialogClassName="modal-top" aria-labelledby="modal-excluir-doador-title" aria-describedby="modal-excluir-doador-desc">
        <Modal.Header closeButton>
          <Modal.Title id="modal-excluir-doador-title">Confirmar Exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body id="modal-excluir-doador-desc">
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
            disabled={!isAdmin}
            title={!isAdmin ? 'Apenas Administradores podem confirmar exclusão' : 'Excluir'}
            className={!isAdmin ? 'disabled-action' : ''}
          >
            Excluir
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default TabelaDoadores;

function renderDocumento(doador) {
  const tipoStr = (doador.tipo ?? doador.tipoDoador ?? doador.tipo_doador ?? '').toString().toLowerCase();
  const isPJByTipo = tipoStr.includes('jurídica') || tipoStr.includes('pj') || tipoStr.includes('juridica');
  const hasCNPJ = Boolean(doador.cnpj);
  const isPJ = isPJByTipo || hasCNPJ;

  if (isPJ) {
    const cnpj = String(doador.cnpj || '').trim();
    if (!cnpj) return '-';
    return validarCNPJ(cnpj) ? formatarCNPJ(cnpj) : (<span className="text-danger">CNPJ inválido</span>);
  }

  const cpf = String(doador.cpf || '').trim();
  if (!cpf) return '-';
  return validarCPF(cpf) ? formatarCPF(cpf) : (<span className="text-danger">CPF inválido</span>);
}