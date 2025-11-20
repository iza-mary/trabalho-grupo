import { useEffect, useMemo, useRef, useState } from 'react'
import { Modal, Button } from 'react-bootstrap'
import { movimentarProduto } from '../../services/produtosService'

export default function MovimentacaoModal({ show, onClose, item, items = [], onSuccess }) {
  const lastFocusEl = useRef(null)
  const [produtoId, setProdutoId] = useState('')
  const [tipo, setTipo] = useState('entrada')
  const [quantidade, setQuantidade] = useState('')
  const [observacao, setObservacao] = useState('')
  const [erro, setErro] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (show) {
      lastFocusEl.current = document.activeElement
      setProdutoId(item?.id ? String(item.id) : '')
      setTipo('entrada')
      setQuantidade('')
      setObservacao('')
      setErro('')
    }
  }, [show, item?.id])

  const produtoSelecionado = useMemo(() => {
    if (item?.id) return item
    const idNum = Number(produtoId)
    if (!Number.isFinite(idNum) || idNum <= 0) return null
    return items.find(x => Number(x.id) === idNum) || null
  }, [item, produtoId, items])

  function fechar() {
    onClose?.()
    const el = lastFocusEl.current
    if (el && typeof el.focus === 'function') el.focus()
  }

  async function confirmar() {
    setErro('')
    let alvo = produtoSelecionado
    if (!alvo) {
      setErro('Selecione um produto para movimentar.')
      return
    }
    const qty = Number(quantidade)
    if (!Number.isFinite(qty) || qty <= 0) {
      setErro('Informe uma quantidade válida maior que zero.')
      return
    }
    const atual = Number(alvo.quantidade || 0)
    if (tipo === 'saida' && qty > atual) {
      setErro('Não é possível remover quantidade superior ao estoque atual.')
      return
    }
    try {
      setSubmitting(true)
      const res = await movimentarProduto(alvo.id, { tipo, quantidade: qty, observacao })
      if (res?.success) {
        const abaixoMinimo = !!res?.abaixoMinimo
        const msg = abaixoMinimo
          ? 'Movimentação realizada. Atenção: estoque abaixo do mínimo.'
          : 'Movimentação realizada com sucesso.'
        onSuccess?.(msg)
        fechar()
      } else {
        setErro(res?.error || 'Falha ao registrar movimentação de estoque.')
      }
    } catch (err) {
      setErro(err?.message || 'Erro ao realizar movimentação.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={fechar} centered dialogClassName="modal-dialog-centered">
      <Modal.Header closeButton>
        <Modal.Title>Movimentar Estoque</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!item && (
          <div className="mb-3">
            <label className="form-label" htmlFor="movProduto">Produto</label>
            <select
              id="movProduto"
              className="form-select"
              value={produtoId}
              onChange={e => setProdutoId(e.target.value)}
            >
              <option value="">Selecione um produto</option>
              {items.map(it => (
                <option key={it.id} value={it.id}>{it.nome}</option>
              ))}
            </select>
          </div>
        )}

        {produtoSelecionado && (
          <div className="mb-3">
            <div className="mb-2"><strong>Produto:</strong> {produtoSelecionado.nome}</div>
            <div className="mb-2"><strong>Estoque atual:</strong> {Number(produtoSelecionado.quantidade || 0)}</div>
            <div className="mb-2"><strong>Estoque mínimo:</strong> {Number(produtoSelecionado.estoque_minimo || 0)}</div>
          </div>
        )}

        <div className="mb-3">
          <label className="form-label" htmlFor="movTipo">Tipo de operação</label>
          <select id="movTipo" className="form-select" value={tipo} onChange={e => setTipo(e.target.value)}>
            <option value="entrada">Entrada (Adicionar)</option>
            <option value="saida">Saída (Remover)</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="movQtd">Quantidade</label>
          <input
            id="movQtd"
            type="number"
            className="form-control"
            min={1}
            value={quantidade}
            onChange={e => setQuantidade(e.target.value)}
            placeholder="Informe a quantidade"
          />
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="movObs">Observação (opcional)</label>
          <textarea
            id="movObs"
            className="form-control"
            rows={3}
            value={observacao}
            onChange={e => setObservacao(e.target.value)}
            placeholder="Ex.: ajuste de inventário, compra, perda, etc."
          />
        </div>

        {erro && <div role="alert" className="alert alert-danger">{erro}</div>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={fechar} disabled={submitting}>Cancelar</Button>
        <Button variant="primary" onClick={confirmar} disabled={submitting}>
          {submitting ? 'Salvando...' : 'Confirmar'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}