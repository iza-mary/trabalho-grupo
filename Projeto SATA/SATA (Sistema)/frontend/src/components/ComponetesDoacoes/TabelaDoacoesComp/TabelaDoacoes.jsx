import { Card, Button, Modal } from 'react-bootstrap';
import StandardTable from '../../ui/StandardTable';
import { BiPencil, BiTrash } from 'react-icons/bi';
import './tabeladoacoes.css';
import DoacaoTipoBadge from './doacaoTipoBadge';
import { useCallback, useEffect, useRef, useState } from 'react';
import doacoesService from '../../../services/doacaoService';

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

    const loadDoacoes = useCallback(async () => {
    const dados = await doacoesService.getAll();
    setDoacoes(dados);
    setDoacoesApp(dados);
  }, [setDoacoes, setDoacoesApp])

  useEffect(() => {
    loadDoacoes();
  }, [loadDoacoes]);
  useEffect(() => {
    setDoacoes(doacoesApp || [])
  }, [doacoesApp])

    const [sortBy, setSortBy] = useState('data');
    const [sortAsc, setSortAsc] = useState(true);
    const PAGE_SIZE = 20;
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const loaderRef = useRef(null);
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
    const visibleDoacoes = sortedDoacoes.slice(0, visibleCount);

    // Reseta contador visível quando filtros/ordenação/dados mudam
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [PAGE_SIZE, sortBy, sortAsc, doacoes]);

    // Observa o sentinel no final da tabela para carregar mais itens ao rolar
    useEffect(() => {
        const node = loaderRef.current;
        if (!node) return;
        const observer = new IntersectionObserver((entries) => {
            const [entry] = entries;
            if (entry.isIntersecting) {
                setVisibleCount((prev) => {
                    if (prev >= sortedDoacoes.length) return prev;
                    const next = prev + PAGE_SIZE;
                    return next > sortedDoacoes.length ? sortedDoacoes.length : next;
                });
            }
        }, { root: null, rootMargin: '0px', threshold: 1.0 });
        observer.observe(node);
        return () => observer.disconnect();
    }, [sortedDoacoes, PAGE_SIZE]);

    // Removida paginação baseada em botões; o carregamento é contínuo pelo sentinel

    const handleSort = (key) => {
        if (sortBy === key) {
            setSortAsc(!sortAsc);
        } else {
            setSortBy(key);
            setSortAsc(true);
        }
        setVisibleCount(PAGE_SIZE);
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
        const floatValue = Number(value);
        if (!Number.isFinite(floatValue)) return '-';
        return floatValue.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    const formatQuantity = (value) => {
        const intValue = parseInt(value, 10);
        return Number.isFinite(intValue) ? String(intValue) : '-';
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
                            <StandardTable>
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
                                        visibleDoacoes.map((d) => (
                                            <tr key={d.id}>
                                                <td>
                                                    {formatDate(d.data)}
                                                </td>
                                                <td>{d.doacao.item || '-'}</td>
                                                <td>
                                                    <DoacaoTipoBadge tipo={d.tipo}></DoacaoTipoBadge>
                                                </td>
                                                {d.tipo.toUpperCase() === "D" ? (
                                                    <td>{formatCurrency(d.doacao?.valor)}</td>
                                                ) : (
                                                    <td>{formatQuantity(d.doacao?.qntd)}</td>
                                                )}
                                                <td>{d.idoso ?? '-'}</td>
                                                <td>{(d.doador && d.doador.nome) ? d.doador.nome : '-'}</td>
                                                <td>
                                                    {d.evento ?? '-'}
                                                </td>
                                                <td>{d.obs ?? '-'}</td>
                                                <td>
                                                    <div className='botoes-acao d-flex'>
                                                        <Button className='action-btns' title='Editar' size='sm' onClick={() => { onEdit(d), editando(false) }} variant='outline-primary'>
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
                            </StandardTable>
                        )
                    }
                    {/* Sentinel de carregamento contínuo */}
                    <div ref={loaderRef} style={{ height: '1px' }} aria-hidden="true"></div>

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