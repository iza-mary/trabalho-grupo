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
import api from '../services/api';
import { useDialog } from '../context/useDialog';

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
  const dialog = useDialog();


  const carregarDoadores = async () => {
    try {
      setCarregando(true);
      // Substitui fetch por axios com credenciais
      const { data } = await api.get('/doadores');
      if (!data?.success) throw new Error(data?.message || 'Erro ao carregar doadores');
      const lista = Array.isArray(data?.data) ? data.data : [];
      setDoadores(lista);
      setErro(null);
    } catch (e) {
      console.error(e);
      // Mensagem amigável para 401
      const status = e?.response?.status;
      if (status === 401) {
        setErro('Não autenticado. Faça login novamente.');
      } else {
        setErro(e.message || 'Falha ao carregar doadores');
      }
    } finally {
      setCarregando(false);
    }
  };

  const handleCriar = async (novoDoador) => {
    try {
      const { data } = await api.post('/doadores', novoDoador);
      if (!data?.success) throw new Error(data?.message || 'Falha ao cadastrar doador');
      await carregarDoadores();
      setMostrarTabela(true);
      alert('Doador cadastrado com sucesso!');
    } catch (e) {
      console.error(e);
      alert(e.message || 'Falha ao cadastrar doador');
    }
  };

  const handleEditar = async (doadorAtualizado) => {
    try {
      const { data } = await api.put(`/doadores/${doadorAtualizado.id}`, doadorAtualizado);
      if (!data?.success) throw new Error(data?.message || 'Falha ao editar doador');
      await carregarDoadores();
      setMostrarModalEdicao(false);
      setDoadorEditar(null);
      alert('Doador atualizado com sucesso!');
    } catch (e) {
      console.error(e);
      alert(e.message || 'Falha ao editar doador');
    }
  };

  const handleDeletar = async () => {
    try {
      if (!doadorParaDeletar) return;
      const { data } = await api.delete(`/doadores/${doadorParaDeletar.id}`);
      if (!data?.success) throw new Error(data?.message || 'Falha ao excluir doador');
      await carregarDoadores();
      setDoadorParaDeletar(null);
      alert('Doador excluído com sucesso!');
    } catch (e) {
      console.error(e);
      const total = e?.response?.data?.totalDoacoes;
      const msg = e?.response?.data?.message || e.message || 'Falha ao excluir doador';
      if (typeof total === 'number' && total > 0) {
        // Mensagem clara, amigável, profissional e visualmente destacada
        dialog.alert(
          (
            <div>
              <Alert variant="danger" className="mb-3">
                <strong>Operação não permitida.</strong><br />
                Este doador não pode ser excluído pois possui {total} doação(ões) registrada(s) no sistema.
              </Alert>
              <p className="mb-3">
                Para remover este cadastro, primeiro é necessário excluir todas as doações associadas ou entrar em contato com o administrador do sistema.
              </p>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Doador: {doadorParaDeletar?.nome}</span>
              </div>
            </div>
          ),
          { title: 'Exclusão não permitida', okLabel: 'Entendi' }
        );
      } else {
        alert(msg);
      }
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
        const hasCPF = !!(d.cpf && String(d.cpf).trim().length > 0);
        const hasCNPJ = !!(d.cnpj && String(d.cnpj).trim().length > 0);
        if (tipo === 'pf') return hasCPF && !hasCNPJ;
        if (tipo === 'pj') return hasCNPJ && !hasCPF;
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



  const prepararDeletar = (d) => setDoadorParaDeletar(d);

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