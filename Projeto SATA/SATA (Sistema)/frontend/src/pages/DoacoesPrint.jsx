import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Button, Spinner } from 'react-bootstrap'
import logo from '../styles/Logo sem fundo.png'
import { downloadPdf } from '../utils/pdf'
import { Link, useLocation } from 'react-router-dom'
import doacoesService from '../services/doacaoService'
import { removeManualPageBreaks, applySpacingNormalization, removeSpacingNormalization } from '../utils/printSanitizer'
import '../styles/ficha.css'
import '../styles/print.css'

function formatDateBR(v) {
  if (!v) return '—'
  try {
    const d = typeof v === 'string' ? new Date(v) : v
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('pt-BR')
  } catch { return '—' }
}

function renderDetalhe(d) {
  const tipo = String(d?.tipo || '').toUpperCase()
  const isMoney = (tipo === 'D' || tipo === 'DINHEIRO')
  const isAlimento = (tipo === 'A' || tipo === 'ALIMENTO')
  const isOutros = (tipo === 'O' || tipo === 'OUTROS' || tipo === 'OUTRO')
  if (isMoney) {
    const valor = d?.doacao?.valor ?? d?.valor
    if (valor == null) return '—'
    const n = Number(valor)
    if (isNaN(n)) return String(valor)
    return `R$ ${n.toFixed(2)}`
  }
  const q = d?.doacao?.quantidade ?? d?.doacao?.qntd ?? d?.quantidade ?? d?.qntd
  const un = d?.doacao?.unidade_medida ?? d?.unidade_medida
  const item = (() => {
    if (isAlimento) {
      return d?.doacao?.tipo_alimento ?? d?.tipo_alimento ?? d?.doacao?.item ?? d?.item
    }
    if (isOutros) {
      return d?.doacao?.descricao_item ?? d?.descricao_item ?? d?.doacao?.item ?? d?.item
    }
    return d?.doacao?.item ?? d?.item
  })()
  if (q != null) return `${q} ${un || ''} ${item || ''}`.trim()
  return item || '—'
}

function renderItemName(d) {
  const tipo = String(d?.tipo || '').toUpperCase()
  if (tipo === 'D' || tipo === 'DINHEIRO') return 'Doação em dinheiro'
  const itemCandidate = d?.doacao?.descricao_item
    ?? d?.descricao_item
    ?? d?.doacao?.tipo_alimento
    ?? d?.tipo_alimento
    ?? d?.doacao?.item
    ?? d?.item
    ?? null
  return itemCandidate || '—'
}

const DoacoesPrint = () => {
  const [doacoes, setDoacoes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const tipo = params.get('tipo') || 'todos'
  const data = params.get('data') || 'todos'
  const destinatario = params.get('destinatario') || 'todos'
  const busca = params.get('busca') || ''
  const ordenacao = params.get('ordenacao') || ''
  const containerRef = useRef(null)

  const loadDoacoes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const lista = await doacoesService.getByFiltred({ tipo, data, destinatario, busca })
      setDoacoes(Array.isArray(lista) ? lista : [])
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Erro ao carregar doações')
    } finally {
      setLoading(false)
    }
  }, [tipo, data, destinatario, busca])

  useEffect(() => { loadDoacoes() }, [loadDoacoes])

  const visible = useMemo(() => {
    let lista = Array.isArray(doacoes) ? [...doacoes] : []
    switch (ordenacao) {
      case 'data_asc':
        lista.sort((a, b) => new Date(a?.data) - new Date(b?.data))
        break
      case 'data_desc':
        lista.sort((a, b) => new Date(b?.data) - new Date(a?.data))
        break
      default:
        lista.sort((a, b) => new Date(b?.data) - new Date(a?.data))
        break
    }
    return lista
  }, [doacoes, ordenacao])

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

  const pageTitle = 'Lista de Doações'
  
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
            <Link to="/doacoes" className="btn btn-outline-secondary">Voltar</Link>
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
                    <th>Data</th>
                    <th>Tipo</th>
                    <th>Detalhe</th>
                    <th>Doador</th>
                    <th>Destinatário</th>
                  </tr>
                </thead>
                <tbody>
                  {(visible || []).map((d) => (
                    <React.Fragment key={d.id}>
                      <tr>
                        <td>{formatDateBR(d.data)}</td>
                        <td>{(() => {
                          const t = String(d?.tipo || '').toUpperCase();
                          if (t === 'D' || t === 'DINHEIRO') {
                            const v = d?.doacao?.valor ?? d?.valor;
                            const n = Number(v);
                            return Number.isFinite(n) ? `Dinheiro - R$ ${n.toFixed(2)}` : 'Dinheiro';
                          }
                          return d?.tipo ?? '—';
                        })()}</td>
                        <td>{renderDetalhe(d)}</td>
                        <td>{d?.doador?.nome ?? d?.doador_nome ?? '—'}</td>
                        <td>{d?.idoso ?? '—'}</td>
                      </tr>
                      {(['A','O'].includes(String(d?.tipo || '').toUpperCase())) && (
                        <tr>
                          <td colSpan={5}><strong>Item:</strong> {renderItemName(d)}</td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {(!loading && visible?.length === 0) && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-3">Nenhuma doação encontrada</td>
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

export default DoacoesPrint
