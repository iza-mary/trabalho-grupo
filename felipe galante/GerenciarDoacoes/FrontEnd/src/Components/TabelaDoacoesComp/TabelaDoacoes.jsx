import { Card, Table, Button, Modal } from 'react-bootstrap';
import { BiPencil, BiTrash } from 'react-icons/bi';
import './tabeladoacoes.css';
import DoacaoTipoBadge from './doacaoTipoBadge';
import { useEffect, useState } from 'react';
import doacoesService from '../../services/doacaoService';

function TabelaDoacoes({ onDelete, editando, onEdit, doacao: doacaoToEdit, setDoacoesApp, doacoesApp }) {
    const [doacao, setDoacao] = useState({
        id: "",
        data: "",
        tipo: "",
        valor: "",
        doador: {
            doadorId: 0,
            nome: ""
        },
        evento: "",
        obs: "",
        doacao: {
            valor: "",
            qntd: "",
            item: ""
        }
    })
    const [showDelete, setShowDelete] = useState(false);
    const [doacoes, setDoacoes] = useState([]);

    const loadDoacoes = async () => {
    const dados = await doacoesService.getAll();
    setDoacoes(dados);
    setDoacoesApp(dados);
  }

  useEffect(() => {
    loadDoacoes();
  }, []);
  useEffect(() => {
    if (doacoesApp.length > 0) {
        setDoacoes(doacoesApp)
    }
  }, [doacoesApp])

    const [paginaAtual, setPaginaAtual] = useState(1);
    const [sortBy, setSortBy] = useState('data');
    const [sortAsc, setSortAsc] = useState(true);
    const itensPorPagina = 10
    const indexUltimoItem = paginaAtual * itensPorPagina;
    const indexPrimeiroItem = indexUltimoItem - itensPorPagina;
    const sortedDoacoes = [...doacoes].sort((a, b) => {
        const getValue = (d, key) => {
            if (key === 'data') return new Date(d.data).getTime();
            if (key === 'item') return d.doacao.item?.toLowerCase() || '';
            if (key === 'tipo') return d.tipo || '';
            if (key === 'valor') return d.tipo.toUpperCase() === 'D' ? parseFloat(d.doacao.valor || 0) : parseInt(d.doacao.qntd || 0);
            if (key === 'idoso') return d.idoso?.toLowerCase() || '';
            if (key === 'doador') return d.doador?.nome?.toLowerCase() || '';
            if (key === 'evento') return d.evento?.toLowerCase() || '';
            if (key === 'obs') return d.obs?.toLowerCase() || '';
            return '';
        }
        const va = getValue(a, sortBy);
        const vb = getValue(b, sortBy);
        if (va < vb) return sortAsc ? -1 : 1;
        if (va > vb) return sortAsc ? 1 : -1;
        return 0;
    });
    const doacoesPaginaAtual = sortedDoacoes.slice(indexPrimeiroItem, indexUltimoItem)
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

    const handleSort = (key) => {
        if (sortBy === key) {
            setSortAsc(!sortAsc);
        } else {
            setSortBy(key);
            setSortAsc(true);
        }
        setPaginaAtual(1);
    };

    useEffect(() => {
        if (doacaoToEdit) {
            setDoacao({
                id: doacaoToEdit.id,
                data: doacaoToEdit.data || "",
                tipo: doacaoToEdit.tipo || "",
                doador: {
                    doadorId: doacaoToEdit.doador.doadorId || "",
                    nome: doacaoToEdit.doador.nome || ""
                },
                evento: doacaoToEdit.evento || "",
                obs: doacaoToEdit.obs || "",
                doacao: doacaoToEdit.tipo.toUpperCase() === "D" ? {
                        valor: doacaoToEdit.doacao.valor || "",
                    } : {
                        qntd: doacaoToEdit.doacao.qntd || "",
                        item: doacaoToEdit.doacao.item || ""
                    }
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
                            <Table striped hover responsive>
                                <thead>
                                    <tr>
                                        <th role="button" onClick={() => handleSort('data')}>Data</th>
                                        <th role="button" onClick={() => handleSort('item')}>Item</th>
                                        <th role="button" onClick={() => handleSort('tipo')}>Tipo</th>
                                        <th role="button" onClick={() => handleSort('valor')}>Valor/Quant</th>
                                        <th role="button" onClick={() => handleSort('idoso')}>Idoso</th>
                                        <th role="button" onClick={() => handleSort('doador')}>Doador</th>
                                        <th role="button" onClick={() => handleSort('evento')}>Evento</th>
                                        <th role="button" onClick={() => handleSort('obs')}>Desc/Obs</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {
                                        doacoesPaginaAtual.map((d) => (
                                            <tr key={d.id}>
                                                <td>
                                                    {formatDate(d.data)}
                                                </td>
                                                <td>{d.doacao.item || '-'}</td>
                                                <td>
                                                    <DoacaoTipoBadge tipo={d.tipo}></DoacaoTipoBadge>
                                                </td>
                                                {d.tipo.toUpperCase() === "D" ? (
                                                    <td>{formatCurrency(d.doacao.valor)}</td>
                                                ) : (
                                                    <td>{parseInt(d.doacao.qntd)}</td>
                                                )}
                                                <td>{d.idoso ?? '-'}</td>
                                                <td>{d.doador.nome}</td>
                                                <td>
                                                    {d.evento ?? '-'}
                                                </td>
                                                <td>{d.obs ?? '-'}</td>
                                                <td>
                                                    <div className='botoes-acao d-flex'>
                                                        <Button className='action-btns' title='Editar' size='sm' onClick={() => { onEdit(d), editando(false) }} variant='outline-warning'>
                                                            <BiPencil></BiPencil>
                                                        </Button>
                                                        <Button className='action-btns' title='Excluir' size='sm' onClick={() => { setShowDelete(true), handleDelete(d) }} variant='outline-danger'>
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