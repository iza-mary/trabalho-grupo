import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import Navbar from '../components/Navbar';
import { Clipboard } from 'react-bootstrap-icons';
import HeaderTabela from '../components/ComponentesDoadores/HeaderTabela';
import FiltroBuscaDoadores from '../components/ComponentesDoadores/FiltroBuscaDoadores';
import Header from '../components/ComponentesDoadores/Header';
import TabelaDoadores from '../components/ComponentesDoadores/TabelaDoador';
import FormDoador from '../components/ComponentesDoadores/FormDoador';
import FormEditDoador from '../components/ComponentesDoadores/FormEditDoador';

function SataDoadores() {
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [mostrarTabela, setMostrarTabela] = useState(true);
  const [doadores, setDoadores] = useState([]);
  const [filtros, setFiltros] = useState({ tipo: '', ordemData: '' });
  const [termos, setTermos] = useState([]); // barra de pesquisa livre
  const [mostrarModalEdicao, setMostrarModalEdicao] = useState(false);
  const [doadorEditar, setDoadorEditar] = useState(null);
  const [doadorParaDeletar, setDoadorParaDeletar] = useState(null);

  const API = 'http://localhost:3000/api/doadores';

  const carregarDoadores = async () => {
    try {
      setCarregando(true);
      const res = await fetch(API);
      if (!res.ok) throw new Error('Falha ao carregar doadores');
      const result = await res.json();
      if (result && result.success) {
        const lista = Array.isArray(result.data) ? result.data : [];
        setDoadores(lista);
        setErro(null);
      } else {
        throw new Error(result?.message || 'Erro ao carregar doadores');
      }
    } catch (e) {
      console.error(e);
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDoadores();
  }, []);

  const doadoresFiltrados = useMemo(() => {
    let lista = doadores;

    // Pesquisa livre (nome, cpf, telefone)
    if (termos && termos.length > 0) {
      lista = lista.filter(d => {
        const base = `${d.nome || ''} ${d.cpf || ''} ${d.telefone || ''}`.toLowerCase();
        return termos.every(t => base.includes(t));
      });
    }

    const { tipo, ordemData } = filtros || {};

    if (tipo) {
      lista = lista.filter(d => {
        const t = (d.tipo ?? d.tipoDoador ?? d.tipo_doador ?? '').toString().toLowerCase();
        if (!t) return false;
        if (tipo === 'pf') return t.includes('física') || t.includes('pf') || t.includes('fisica');
        if (tipo === 'pj') return t.includes('jurídica') || t.includes('pj') || t.includes('juridica');
        return true;
      });
    }

    if (ordemData) {
      const getTime = (d) => {
        const raw = d.dataCadastro ?? d.data_cadastro ?? d.createdAt ?? null;
        if (!raw) return 0;
        try {
          return typeof raw === 'string' ? Date.parse(raw) || 0 : new Date(raw).getTime() || 0;
        } catch {
          return 0;
        }
      };
      lista = [...lista].sort((a, b) => {
        const ta = getTime(a);
        const tb = getTime(b);
        return ordemData === 'asc' ? ta - tb : tb - ta;
      });
    }

    return lista;
  }, [doadores, filtros, termos]);

  const handleCriar = async (novoDoador) => {
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoDoador)
      });
      if (!res.ok) throw new Error('Falha ao cadastrar doador');
      await carregarDoadores();
      setMostrarTabela(true);
      alert('Doador cadastrado com sucesso!');
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  };

  const handleEditar = async (doadorAtualizado) => {
    try {
      const res = await fetch(`${API}/${doadorAtualizado.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doadorAtualizado)
      });
      if (!res.ok) throw new Error('Falha ao editar doador');
      await carregarDoadores();
      setMostrarModalEdicao(false);
      setDoadorEditar(null);
      alert('Doador atualizado com sucesso!');
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  };

  const prepararDeletar = (d) => setDoadorParaDeletar(d);
  const handleDeletar = async () => {
    try {
      if (!doadorParaDeletar) return;
      const res = await fetch(`${API}/${doadorParaDeletar.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir doador');
      await carregarDoadores();
      setDoadorParaDeletar(null);
      alert('Doador excluído com sucesso!');
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  };

  if (carregando) {
    return (
      <Navbar>
        <Container fluid className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <Alert variant="info">Carregando doadores...</Alert>
        </Container>
      </Navbar>
    );
  }

  if (erro) {
    return (
      <Navbar>
        <Container fluid className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <Alert variant="danger">{erro}</Alert>
        </Container>
      </Navbar>
    );
  }

  return (
    <Navbar>
      <div className="content-area full-main">
        <Container fluid>

          {mostrarTabela ? (
            <>
              <HeaderTabela desativaTabela={setMostrarTabela} />
              <FiltroBuscaDoadores onBuscar={setFiltros} onPesquisar={setTermos} />
              <TabelaDoadores
                ativaModal={setMostrarModalEdicao}
                doadores={doadoresFiltrados}
                setDoadorEditar={setDoadorEditar}
                onDelete={handleDeletar}
                handleDeletar={prepararDeletar}
              />
            </>
          ) : (
            <>
              <Header ativaTabela={setMostrarTabela} />
              <FormDoador onSubmit={handleCriar} doadores={doadores} />
            </>
          )}

          <FormEditDoador
            doadores={doadores}
            show={mostrarModalEdicao}
            ocultaModal={setMostrarModalEdicao}
            doador={doadorEditar}
            onEdit={handleEditar}
          />
        </Container>
      </div>
    </Navbar>
  );
}

export default SataDoadores;