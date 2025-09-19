import { Card, Table, Button, Modal } from 'react-bootstrap';
import { BiPencil, BiTrash } from 'react-icons/bi';
import './tabeladoacoes.css';
import DoacaoTipoBadge from './doacaoTipoBadge';
import { useEffect, useState } from 'react';

function TabelaDoacoes({ doacoes, onDelete, editando, onEdit, doacao: doacaoToEdit }) {
    const [doacao, setDoacao] = useState({
        id: "",
        data: "",
        item: "",
        tipo: "",
        valorquantidade: "",
        destinatario: "",
        doador: "",
        telefone: "",
        evento: "",
        obs: ""
    })
    const [showDelete, setShowDelete] = useState(false);

    const [paginaAtual, setPaginaAtual] = useState(1);
    const itensPorPagina = 10
    const indexUltimoItem = paginaAtual * itensPorPagina;
    const indexPrimeiroItem = indexUltimoItem - itensPorPagina;
    const doacoesPaginaAtual = doacoes.slice(indexPrimeiroItem, indexUltimoItem)
    const totalPaginas = Math.ceil(doacoes.length / itensPorPagina);

    useEffect(() => {
    const totalPaginas = Math.ceil(doacoes.length / itensPorPagina);
    if (paginaAtual > totalPaginas) {
        setPaginaAtual(1);
    }
    }, [doacoes]);

    const renderBotoesPaginacao = () => {
        const botoes = [];
        const maxBotoes = 5;
        let inicio = Math.max(1, paginaAtual - 2);
        let fim = Math.min(totalPaginas, inicio + maxBotoes - 1);

        if (fim - inicio < maxBotoes - 1) {
            inicio = Math.max(1, fim - maxBotoes + 1);
        }

        if (inicio > 1) {
            botoes.push(
                <Button key={1} onClick={() => setPaginaAtual(1)} size="sm" variant="outline-primary">
                    1
                </Button>,
                <span key="start-ellipsis" style={{ margin: '0 5px' }}>...</span>
            );
        }

        for (let i = inicio; i <= fim; i++) {
            botoes.push(
                <Button
                    key={i}
                    onClick={() => setPaginaAtual(i)}
                    variant={paginaAtual === i ? 'primary' : 'outline-primary'}
                    size="sm"
                    style={{ marginRight: '5px' }}
                >
                    {i}
                </Button>
            );
        }

        if (fim < totalPaginas) {
            botoes.push(
                <span key="end-ellipsis" style={{ margin: '0 5px' }}>...</span>,
                <Button key={totalPaginas} onClick={() => setPaginaAtual(totalPaginas)} size="sm" variant="outline-primary">
                    {totalPaginas}
                </Button>
            );
        }

        return botoes;
    };

    useEffect(() => {
        if (doacaoToEdit) {
            setDoacao({
                id: doacaoToEdit.id,
                data: doacaoToEdit.data || "",
                item: doacaoToEdit.item || "",
                tipo: doacaoToEdit.tipo || "",
                valorquantidade: doacaoToEdit.valorquantidade || "",
                destinatario: doacaoToEdit.destinatario || "",
                doador: doacaoToEdit.doador || "",
                telefone: doacaoToEdit.telefone || "",
                evento: doacaoToEdit.evento || "",
                obs: doacaoToEdit.obs || ""
            })
        }
    }, [doacaoToEdit])

    const formatDate = (value) => {
        const isoDate = value;
        const date = new Date(isoDate);
        const formatted = date.toLocaleDateString('pt-BR');
        return formatted
    }

    const formatCurrency = (value) => {
        const floatValue = parseFloat(value)
        return floatValue.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        })
    }

    const handleDelete = (doacao) => {
        setDoacao(doacao)
    }

    return (
        <Card>
            <Card.Body>
                <div className="table-responsive">
                    {doacoes.length === 0 ?
                        (
                            <div className='text-center p-4'>
                                <p className='text-muted'>Nenhuma doação encontrada</p>
                            </div>
                        ) : (
                            <Table>
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Item</th>
                                        <th>Tipo</th>
                                        <th>Valor/Quant</th>
                                        <th>Destinatário</th>
                                        <th>Doador</th>
                                        <th>Telefone</th>
                                        <th>Evento</th>
                                        <th>Desc/Obs</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {
                                        doacoesPaginaAtual.map((doacao) => (
                                            <tr key={doacao.id}>
                                                <td>
                                                    {formatDate(doacao.data)}
                                                </td>
                                                <td>{doacao.item}</td>
                                                <td>
                                                    <DoacaoTipoBadge tipo={doacao.tipo}></DoacaoTipoBadge>
                                                </td>
                                                {doacao.tipo.toLowerCase() === "dinheiro" ? (
                                                    <td>{formatCurrency(doacao.valorQuantidade)}</td>
                                                ) : (
                                                    <td>{parseInt(doacao.valorQuantidade)}</td>
                                                )}
                                                <td>{doacao.destinatario}</td>
                                                <td>{doacao.doador}</td>
                                                <td>{doacao.telefone}</td>
                                                <td>
                                                    {doacao.evento}
                                                </td>
                                                <td>{doacao.obs}</td>
                                                <td>
                                                    <div className='d-flex'>
                                                        <Button className='action-btns' title='Editar' size='sm' onClick={() => { onEdit(doacao), editando(false) }} variant='outline-warning'>
                                                            <BiPencil></BiPencil>
                                                        </Button>
                                                        <Button className='action-btns' title='Excluir' size='sm' onClick={() => { setShowDelete(true), handleDelete(doacao) }} variant='outline-danger'>
                                                            <BiTrash></BiTrash>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </Table>
                        )
                    }
                    <div className="pagination-container" style={{ textAlign: 'center', marginTop: '10px' }}>
                        <Button
                            disabled={paginaAtual === 1}
                            onClick={() => setPaginaAtual(paginaAtual - 1)}
                            variant="secondary"
                            size="sm"
                            style={{ marginRight: '5px' }}
                        >
                            Anterior
                        </Button>

                        {renderBotoesPaginacao()}

                        <Button
                            disabled={paginaAtual === totalPaginas}
                            onClick={() => setPaginaAtual(paginaAtual + 1)}
                            variant="secondary"
                            size="sm"
                            style={{ marginLeft: '5px' }}
                        >
                            Próxima
                        </Button>
                    </div>

                    <Modal show={showDelete} onHide={() => setShowDelete(false)}>
                        <Modal.Header closeButton>
                            <Modal.Title>Excluir doação</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>Tem certeza que deseja excluir essa doação?<br />
                            Se for excluída não poderá ser recuperada, apenas se cadastrada novamente.
                        </Modal.Body>
                        <Modal.Footer>
                            <Button onClick={() => setShowDelete(false)} variant="secondary">
                                Cancelar
                            </Button>
                            <Button onClick={() => { setShowDelete(false), onDelete(doacao) }} variant="danger">
                                Excluir doação
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </div>
            </Card.Body>
        </Card>
    );
}

export default TabelaDoacoes;