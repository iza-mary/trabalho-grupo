import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Button, Spinner } from 'react-bootstrap'
import { downloadPdf } from '../utils/pdf'
import logo from '../styles/Logo sem fundo.png'
import { Link, useLocation } from 'react-router-dom'
import { listarProdutos } from '../services/produtosService'
import { removeManualPageBreaks, applySpacingNormalization, removeSpacingNormalization } from '../utils/printSanitizer'
import '../styles/ficha.css'
import '../styles/print.css'

function formatBRL(v) {
  const n = Number(v)
  if (Number.isNaN(n)) return '—'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const ProdutosPrint = () => {
  const [produtos, setProdutos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const search = params.get('search') || ''
  const categoria = params.get('categoria') || ''
  const minPreco = params.get('minPreco') || ''
  const maxPreco = params.get('maxPreco') || ''
  const sort = params.get('sort') || 'nome'
  const order = params.get('order') || 'ASC'
  const containerRef = useRef(null)

  const loadProdutos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const reqParams = {
        ...(search ? { search } : {}),
        ...(categoria ? { categoria } : {}),
        ...(minPreco !== '' ? { minPreco: Number(minPreco) } : {}),
        ...(maxPreco !== '' ? { maxPreco: Number(maxPreco) } : {}),
        sort,
        order,
      }
      const res = await listarProdutos(reqParams)
      const lista = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
      setProdutos(lista)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }, [search, categoria, minPreco, maxPreco, sort, order])

  useEffect(() => { loadProdutos() }, [loadProdutos])

  const visible = useMemo(() => {
    let lista = Array.isArray(produtos) ? [...produtos] : []
    if (search) {
      const q = search.toLowerCase()
      lista = lista.filter(p => (p.nome || '').toLowerCase().includes(q) || (p.descricao || '').toLowerCase().includes(q))
    }
    if (categoria) {
      lista = lista.filter(p => String(p.categoria || '') === categoria)
    }
    const min = minPreco !== '' ? Number(minPreco) : null
    const max = maxPreco !== '' ? Number(maxPreco) : null
    if (min != null && Number.isFinite(min)) {
      lista = lista.filter(p => Number(p.preco ?? 0) >= min)
    }
    if (max != null && Number.isFinite(max)) {
      lista = lista.filter(p => Number(p.preco ?? 0) <= max)
    }
    if (sort === 'nome') {
      lista.sort((a, b) => (order === 'DESC' ? (b.nome || '').localeCompare(a.nome || '') : (a.nome || '').localeCompare(b.nome || '')))
    } else if (sort === 'preco') {
      lista.sort((a, b) => (order === 'DESC' ? Number(b.preco ?? 0) - Number(a.preco ?? 0) : Number(a.preco ?? 0) - Number(b.preco ?? 0)))
    } else if (sort === 'quantidade') {
      lista.sort((a, b) => (order === 'DESC' ? Number(b.quantidade ?? 0) - Number(a.quantidade ?? 0) : Number(a.quantidade ?? 0) - Number(b.quantidade ?? 0)))
    }
    return lista
  }, [produtos, search, categoria, minPreco, maxPreco, sort, order])

  const handlePrint = () => {
    const root = containerRef.current
    if (root) {
      root.classList.add('no-manual-breaks')
      removeManualPageBreaks(root)
      applySpacingNormalization(root)
    }
    setTimeout(() => {
      window.print()
      setTimeout(() => {
        if (root) {
          root.classList.remove('no-manual-breaks')
          removeSpacingNormalization(root)
        }
      }, 800)
    }, 0)
  }

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => handlePrint(), 200)
      return () => clearTimeout(t)
    }
  }, [loading])

  const pageTitle = 'Lista de Produtos e Estoque'
  
  const handleDownloadPdf = async () => {
    const root = containerRef.current
    if (!root) return
    root.classList.add('no-manual-breaks')
    removeManualPageBreaks(root)
    applySpacingNormalization(root)
    try {
      await downloadPdf(root, `${pageTitle}.pdf`)
    } finally {
      root.classList.remove('no-manual-breaks')
      removeSpacingNormalization(root)
    }
  }

  return (
    <div className="container-fluid py-3 ficha-root">
      <div ref={containerRef} className="ficha-container">
        <div className="no-print controls-row mb-3 d-flex justify-content-between align-items-center">
          <div>
            <Link to="/produtos" className="btn btn-outline-secondary">Voltar</Link>
          </div>
          <div>
            <Button variant="primary" onClick={handlePrint}>Imprimir</Button>
            <Button variant="outline-secondary" className="ms-2" onClick={handleDownloadPdf}>Baixar PDF</Button>
          </div>
        </div>

        <header className="ficha-header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <img src={logo} alt="Logo" className="ficha-logo" />
            <div>
              <div className="ficha-title h5 mb-0">{pageTitle}</div>
              <div className="ficha-meta small text-muted">Gerado em {new Date().toLocaleDateString('pt-BR')}</div>
              
            </div>
          </div>
        </header>

        <main className="ficha-content">
          {error && <div className="alert alert-danger">{error}</div>}
          {loading && <div className="text-center py-3"><Spinner animation="border" /></div>}
          {!loading && (
            <section className="ficha-section">
              <table className="ficha-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Categoria</th>
                    <th>Quantidade</th>
                    <th>Preço</th>
                  </tr>
                </thead>
                <tbody>
                  {(visible || []).map((p) => (
                    <tr key={p.id}>
                      <td>{p.nome || '—'}</td>
                      <td>{p.categoria || '—'}</td>
                      <td>{p.quantidade != null ? `${p.quantidade} ${p.unidade_medida || ''}` : '—'}</td>
                      <td>{p.preco != null ? formatBRL(p.preco) : '—'}</td>
                    </tr>
                  ))}
                  {(!loading && visible?.length === 0) && (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-3">Nenhum produto encontrado</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          )}
        </main>
        
      </div>
    </div>
  )
}

export default ProdutosPrint