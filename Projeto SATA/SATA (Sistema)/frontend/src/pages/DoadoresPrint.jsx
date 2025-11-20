import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Button, Spinner } from 'react-bootstrap'
import logo from '../styles/Logo sem fundo.png'
import { downloadPdf } from '../utils/pdf'
import { Link, useLocation } from 'react-router-dom'
import api from '../services/api'
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

function renderDocumento(d) {
  const cpf = String(d?.cpf || '').trim()
  const cnpj = String(d?.cnpj || '').trim()
  if (cnpj) return `CNPJ ${cnpj}`
  if (cpf) return `CPF ${cpf}`
  return '—'
}

const DoadoresPrint = () => {
  const [doadores, setDoadores] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const containerRef = useRef(null)
  const location = useLocation()
  const q = new URLSearchParams(location.search)
  const filtroTipo = q.get('tipo') || ''
  const ordemData = q.get('ordemData') || ''
  const termosStr = q.get('termos') || ''
  const termos = useMemo(() => (termosStr ? termosStr.split(',').filter(Boolean) : []), [termosStr])

  const loadDoadores = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let lista = []
      if (termos.length > 0) {
        const { data } = await api.post('/doadores/filtrar', { filtros: termos })
        if (!data?.success) throw new Error(data?.message || 'Erro ao filtrar doadores')
        lista = Array.isArray(data?.data) ? data.data : []
      } else {
        const { data } = await api.get('/doadores')
        if (!data?.success) throw new Error(data?.message || 'Erro ao carregar doadores')
        lista = Array.isArray(data?.data) ? data.data : []
      }
      setDoadores(lista)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Erro ao carregar doadores')
    } finally {
      setLoading(false)
    }
  }, [termos])

  useEffect(() => { loadDoadores() }, [loadDoadores])

  const visible = useMemo(() => {
    let lista = Array.isArray(doadores) ? [...doadores] : []
    if (filtroTipo) {
      lista = lista.filter(d => {
        const hasCPF = !!(d.cpf && String(d.cpf).trim().length > 0)
        const hasCNPJ = !!(d.cnpj && String(d.cnpj).trim().length > 0)
        if (filtroTipo === 'pf') return hasCPF && !hasCNPJ
        if (filtroTipo === 'pj') return hasCNPJ && !hasCPF
        return true
      })
    }
    if (ordemData) {
      const getTime = (d) => {
        const raw = d.dataCadastro ?? d.data_cadastro ?? d.createdAt ?? null
        if (!raw) return 0
        try {
          return typeof raw === 'string' ? Date.parse(raw) || 0 : new Date(raw).getTime() || 0
        } catch { return 0 }
      }
      lista.sort((a, b) => {
        const ta = getTime(a)
        const tb = getTime(b)
        return ordemData === 'asc' ? ta - tb : tb - ta
      })
    } else {
      lista.sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || '')))
    }
    return lista
  }, [doadores, filtroTipo, ordemData])

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

  const pageTitle = 'Lista de Doadores'
  
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
            <Link to="/doadores" className="btn btn-outline-secondary">Voltar</Link>
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
                    <th>CPF/CNPJ</th>
                    <th>Telefone</th>
                    <th>Cadastro</th>
                  </tr>
                </thead>
                <tbody>
                  {(visible || []).map((d) => (
                    <tr key={d.id}>
                      <td>{d.nome || '—'}</td>
                      <td>{renderDocumento(d)}</td>
                      <td>{d.telefone || '—'}</td>
                      <td>{formatDateBR(d.dataCadastro ?? d.data_cadastro)}</td>
                    </tr>
                  ))}
                  {(!loading && visible?.length === 0) && (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-3">Nenhum doador encontrado</td>
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

export default DoadoresPrint