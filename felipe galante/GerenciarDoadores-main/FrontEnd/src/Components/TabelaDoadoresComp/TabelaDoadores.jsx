import { Button, Card, Form, Table } from "react-bootstrap";
import { MdBrush } from "react-icons/md";
import { FaTrashAlt } from "react-icons/fa";
import { useState } from "react";
import Modal from 'react-bootstrap/Modal';
import "./TabelaDoadores.css"

function TabelaDoadores({ ativaModal, doadores, setDoadorEditar, onDelete, handleDeletar, setTermos }) {

    const [deletar, setDeletar] = useState(false);
    let timeoutId;
    const handleFiltrar = (e) => {
        const value = e.target.value;
        const termos = value.toLowerCase().split(" ").filter(Boolean);
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            setTermos(termos);
        }, 1500);
    }

    return (
        <Card>
            <Form className="formBusca">
                <Form.Label>Busca</Form.Label>
                <Form.Control onChange={(e) => { handleFiltrar(e) }} type="text"></Form.Control>
            </Form>
            <Card.Body>
                <div className="table-responsive">
                    {doadores.length === 0 ? (
                        <div className='text-center p-4'>
                            <p className='text-muted'>Nenhuma doação encontrada</p>
                        </div>
                    ) : (
                        <Table>
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>CPF</th>
                                    <th>Telefone</th>
                                    <th>RG</th>
                                    <th>E-mail</th>
                                    <th>Endereço</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>

                            <tbody>
                                {doadores.map((doador) => (
                                    <tr key={doador.id}>
                                        <td>{doador.nome}</td>
                                        <td>{doador.cpf}</td>
                                        <td>{doador.telefone}</td>
                                        <td>{doador.rg || "-"}</td>
                                        <td>{doador.email || "-"}</td>
                                        <td>{`${doador.rua || "- "}, Nº ${doador.numero || "- "}, ${doador.cidade || "- "}, ${doador.complemento || "- "}, ${doador.cep || "- "}`}</td>
                                        <td><Button onClick={() => { ativaModal(true), setDoadorEditar(doador) }} variant="warning" title="Editar"><MdBrush></MdBrush></Button>
                                            <Button onClick={() => { setDeletar(true), handleDeletar(doador) }} variant="danger" title="Excluir"><FaTrashAlt></FaTrashAlt></Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                    <Modal show={deletar} onHide={() => { setDeletar(false) }}>
                        <Modal.Header closeButton>
                            <Modal.Title>Excluir Doador</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>Tem certeza que deseja excluir esse doador? Se excluído não poderá ser recuperado!</Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => { setDeletar(false) }}>
                                Cancelar
                            </Button>
                            <Button onClick={() => { onDelete(), setDeletar(false) }} variant="danger">
                                Excluir
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </div>
            </Card.Body>
        </Card>
    )
}

export default TabelaDoadores;