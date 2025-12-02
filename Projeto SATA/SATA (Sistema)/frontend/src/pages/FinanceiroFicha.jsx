import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button, Spinner } from 'react-bootstrap'
import logo from '../styles/Logo sem fundo.png'
import { downloadPdf } from '../utils/pdf'
import financeiroService from '../services/financeiroService'
import { removeManualPageBreaks, applySpacingNormalization, removeSpacingNormalization } from '../utils/printSanitizer'
import './IdosoFicha.css'
import '../styles/ficha.css'

function formatCurrency(v) {
  const n = Number(v)
  if (Number.isNaN(n)) return '—'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDateBR(v) {
  if (!v) return '—'
  try {
    const d = typeof v === 'string' ? new Date(v) : v
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('pt-BR')
  } catch { return '—' }
}

export default function FinanceiroFicha() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [item, setItem] = useState(null)
  const containerRef = useRef(null)
  

  const pageTitle = useMemo(() => {
    const base = 'Ficha Financeira'
    if (!item) return base
    const dt = formatDateBR(item?.data)
    const tipo = item?.tipo ?? ''
    return `${base} — ${dt} (${tipo})`
  }, [item])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const d = await financeiroService.getById(id)
        if (!active) return
        setItem(d || null)
      } catch (err) {
        if (!active) return
        setError(err?.response?.data?.message || err?.message || 'Erro ao carregar lançamento')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [id])

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
    <div className="ficha-root" aria-label="Página de Ficha Financeira">
      <div className="ficha-container" ref={containerRef}>
        <div className="no-print controls-row mb-3 d-flex justify-content-between align-items-center">
          <div>
            <Link to="/financeiro" className="btn btn-outline-secondary">Voltar</Link>
          </div>
          <div>
            <Button variant="primary" onClick={handlePrint}>Imprimir</Button>
            <Button variant="outline-secondary" className="ms-2" onClick={handleDownloadPdf}>Baixar PDF</Button>
          </div>
        </div>

        <header className="ficha-header" role="banner">
          <div className="d-flex align-items-center gap-2">
            <img className="ficha-logo" src={logo} alt="Logo da instituição" />
            <div>
              <div className="ficha-title">SATA — Sistema de Assistência</div>
              <div className="ficha-meta">{pageTitle}</div>
            </div>
          </div>
        </header>

        <main className="ficha-content" role="main">
          {error && <div className="alert alert-danger">{error}</div>}
          {loading && <div className="text-center py-3"><Spinner animation="border" /></div>}
          {!loading && item && (
            <>
              <section className="ficha-section" aria-labelledby="sec-dados-fin">
                <h3 id="sec-dados-fin">Dados do Lançamento</h3>
                <table className="ficha-table">
                  <tbody>
                    <tr><th>Descrição</th><td>{item?.descricao ?? '—'}</td></tr>
                    <tr><th>Tipo</th><td>{item?.tipo ?? '—'}</td></tr>
                    <tr><th>Valor</th><td>{formatCurrency(item?.valor)}</td></tr>
                    <tr><th>Categoria</th><td>{item?.categoria ?? '—'}</td></tr>
                    <tr><th>Forma de pagamento</th><td>{item?.forma_pagamento ?? '—'}</td></tr>
                    <tr><th>Data</th><td>{formatDateBR(item?.data)}</td></tr>
                  </tbody>
                </table>
              </section>

              <section className="ficha-section" aria-labelledby="sec-rec">
                <h3 id="sec-rec">Recorrência</h3>
                <div>
                  <div><strong>Recorrente:</strong> {item?.recorrente ? 'Sim' : 'Não'}</div>
                  <div><strong>Frequência:</strong> {item?.recorrente ? (item?.frequencia_recorrencia ?? '—') : '—'}</div>
                  <div><strong>Ocorrências:</strong> {item?.recorrente && item?.ocorrencias_recorrencia != null ? String(item.ocorrencias_recorrencia) : '—'}</div>
                </div>
              </section>

              <section className="ficha-section" aria-labelledby="sec-obs">
                <h3 id="sec-obs">Observações</h3>
                <div>{item?.observacao ?? '—'}</div>
              </section>
            </>
          )}
        </main>
        
      </div>
    </div>
  )
}
