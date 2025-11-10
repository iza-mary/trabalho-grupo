import '../App.css'
import './Doacoes.css'
import Navbar from '../components/Navbar'
import TipoDoacao from '../components/ComponetesDoacoes/TipoDoacaoComp/TipoDoacao'
import FormDinheiro from '../components/ComponetesDoacoes/FormDinheiroComp/FormDinheiro'
import FormAlimentos from '../components/ComponetesDoacoes/FormAlimentosComp/FormAlimentos'
import FormOutros from '../components/ComponetesDoacoes/FormOutrosComp/FormOutros'
import Header from '../components/ComponetesDoacoes/HeaderComp/Header'
import HeaderTabela from '../components/ComponetesDoacoes/HeaderTabelaComp/HeaderTabela'
import FiltroBusca from '../components/ComponetesDoacoes/FiltroBuscaComp/FiltroBusca'
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import TabelaDoacoes from '../components/ComponetesDoacoes/TabelaDoacoesComp/TabelaDoacoes'
import doacoesService from '../services/doacaoService'
import FormEditarDin from '../components/ComponetesDoacoes/FormEditarDinComp/FormEditarDin'
import FormEditarAlim from '../components/ComponetesDoacoes/FormEditarAlimComp/FormEditarAlim'
import FormEditarOutros from '../components/ComponetesDoacoes/FormEditarOutrosComp/FormEditarOutros'

function Doacoes() {
  const location = useLocation();
  const [tipoDoacao, setTipoDoacao] = useState('money');
  const [mostraTabela, setMostraTabela] = useState(false);
  const [doacaoToEdit, setDoacaoToEdit] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [filtros, setFiltros] = useState({
    tipo: 'todos',
    data: 'todos',
    destinatario: 'todos',
    busca: ''
  });
  const [ordenacao, setOrdenacao] = useState('data_desc');
  const [doacoes, setDoacoes] = useState([]);

  useEffect(() => {
    console.log(doacoes);
  }, [doacoes]);

  // Abre a tabela ao navegar a partir do menu lateral (apenas quando a rota muda)
  useEffect(() => {
    const shouldOpenTable = Boolean(location?.state?.showTable);
    if (shouldOpenTable) {
      setMostraTabela(true);
    }
  }, [location]);

  const mapTipoFiltro = (tipo) => {
    switch (tipo) {
      case 'dinheiro':
        return 'D';
      case 'alimento':
        return 'A';
      case 'outros':
        return 'O';
      default:
        return 'todos';
    }
  };

  useEffect(() => {
    const fetchFiltros = async () => {
      const filtrosBackend = {
        tipo: mapTipoFiltro(filtros.tipo),
        data: filtros.data,
        destinatario: filtros.destinatario,
        busca: filtros.busca
      };
      try {
        const dados = await doacoesService.getByFiltred(filtrosBackend);
        if (Array.isArray(dados)) {
          setDoacoes(dados);
        }
      } catch (e) {
        console.error('Erro ao filtrar doações', e);
        try {
          const dados = await doacoesService.getAll();
          setDoacoes(dados);
        } catch (err) {
          console.error('Erro ao carregar doações sem filtro', err);
        }
      }
    };
    fetchFiltros();
  }, [filtros]);

  const handleChangeEditando = (editando) => {
    if (editando === false) {
      setModoEdicao(true);
      setMostrarModal(true);
    } else {
      setModoEdicao(false);
      setMostrarModal(false);
    }
  };

  const handleSaveDoacao = async (doacao) => {
    // Normaliza payload para criação evitando 400 no backend
    const doadorIdNorm = doacao?.doador?.doadorId ?? doacao?.doador?.id ?? doacao?.doador;
    const payload = {
      data: typeof doacao.data === 'string' ? doacao.data : (doacao.data?.split?.('T')[0] ?? ''),
      tipo: doacao.tipo,
      idoso: doacao?.idoso?.nome ?? doacao?.idoso ?? '',
      idosoId: doacao?.idoso?.id ?? doacao?.idosoId ?? null,
      evento: doacao.evento ?? '',
      eventoId: doacao?.eventoId ?? null,
      obs: doacao.obs ?? '',
      doador: {
        doadorId: Number(doadorIdNorm),
        nome: doacao?.doador?.nome ?? ''
      },
      doacao:
        doacao.tipo === 'D'
          ? { valor: Number(doacao?.doacao?.valor ?? doacao?.valor ?? 0) }
          : {
              item: doacao?.doacao?.item ?? doacao?.item ?? '',
              qntd: Number(doacao?.doacao?.qntd ?? doacao?.qntd ?? 0),
              unidade_medida: doacao?.doacao?.unidade_medida ?? doacao?.unidade_medida ?? 'Unidade',
              produto_id: doacao?.doacao?.produto_id ?? null
            }
    };

    await doacoesService.add(payload);
  };

  const handleEditDoacao = (doacao) => {
    const base = {
      id: doacao.id,
      data: doacao.data,
      tipo: doacao.tipo,
      idoso: doacao.idoso || '',
      evento: doacao.evento || '',
      eventoId: doacao.eventoId ?? null,
      obs: doacao.obs || '',
      doador: {
        // Garante compatibilidade com diferentes formas de retorno do backend
        doadorId: doacao?.doador?.doadorId ?? doacao?.doador?.id ?? doacao?.doador ?? null,
        nome: doacao?.doador?.nome ?? ''
      }
    };
    const byTipo =
      doacao.tipo === 'D'
        ? { valor: parseFloat(doacao.doacao?.valor ?? 0) }
        : { item: doacao.doacao?.item ?? '', qntd: doacao.doacao?.qntd ?? 0, unidade_medida: doacao.doacao?.unidade_medida ?? 'Unidade' };
    setDoacaoToEdit({ ...base, doacao: byTipo });
    setMostrarModal(true);
  };

  const editDoacao = async (doacao) => {
    // Normaliza payload para o backend evitar 400 (Bad Request)
    const doadorIdNorm = doacao?.doador?.doadorId ?? doacao?.doador?.id ?? doacao?.doador;
    const doadorIdNum = Number(doadorIdNorm);
    // Garantir que doadorId é válido antes de enviar
    if (!Number.isFinite(doadorIdNum) || doadorIdNum <= 0) {
      const nome = doacao?.doador?.nome || '';
      console.error('Doador inválido para atualização:', { doadorIdNorm, nome, doacao });
      alert('Selecione um doador válido antes de salvar.');
      return;
    }
    // Normaliza destinatário (idoso) aceitando tanto objeto quanto string ou campo "destinatario"
    const idosoNomeNorm = (
      doacao?.idoso?.nome ??
      doacao?.idoso ??
      doacao?.destinatario ??
      ''
    );
    const idosoIdNorm = doacao?.idoso?.id ?? doacao?.idosoId ?? null;
    const payload = {
      id: doacao.id,
      // Sempre enviar a data no formato YYYY-MM-DD
      data: (doacao?.data ?? '').toString().slice(0, 10),
      // Backend espera tipo em maiúsculo: "D", "A", "O"
      tipo: String(doacao?.tipo || '').toUpperCase(),
      // Backend aceita nome do idoso em "idoso" e opcionalmente o id em "idosoId"
      idoso: idosoNomeNorm,
      idosoId: idosoIdNorm,
      evento: doacao.evento ?? '',
      eventoId: doacao?.eventoId ?? null,
      obs: doacao.obs ?? '',
      doador: {
        doadorId: doadorIdNum,
        nome: doacao?.doador?.nome ?? ''
      },
      doacao:
        String(doacao?.tipo || '').toUpperCase() === 'D'
          ? { valor: Number(doacao?.doacao?.valor ?? doacao?.valor ?? 0) }
          : {
              item: doacao?.doacao?.item ?? doacao?.item ?? '',
              qntd: Number(doacao?.doacao?.qntd ?? doacao?.qntd ?? 0),
              unidade_medida: doacao?.doacao?.unidade_medida ?? doacao?.unidade_medida ?? 'Unidade',
              produto_id: doacao?.doacao?.produto_id ?? null
            }
    };

    await doacoesService.update(payload);

    // Atualiza lista local com normalização dos campos
    setDoacoes(
      doacoes.map((d) =>
        d.id === payload.id
          ? {
              id: payload.id,
              data: (payload.data || '') + 'T03:00:00.000Z',
              tipo: payload.tipo,
              idoso: payload.idoso || '',
              doador: {
                doadorId: payload.doador.doadorId,
                nome: payload.doador.nome
              },
              evento: payload.evento,
              eventoId: payload.eventoId ?? null,
              obs: payload.obs,
              doacao: {
                qntd: payload.doacao.qntd,
                item: payload.doacao.item,
                valor: payload.doacao.valor,
                unidade_medida: payload.doacao.unidade_medida
              }
            }
          : d
      )
    );
  };

  const handleDeleteDoacao = async (doacao) => {
    try {
      const id = Number(doacao.id);
      await doacoesService.remove(id);
      // Remove da lista local para refletir a exclusão imediatamente
      setDoacoes((prev) => prev.filter((d) => d.id !== id));
      alert('Doação excluída com sucesso!');
    } catch (error) {
      const msg = error?.response?.data?.message || 'Erro ao excluir doação';
      alert(msg);
      console.error('Falha ao excluir doação:', {
        id: doacao?.id,
        error: error?.response?.data || error?.message || error
      });
    }
  };

  const handleFiltrarTipo = (tipo) => {
    setFiltros((prev) => ({ ...prev, tipo: tipo ?? prev.tipo }));
  };

  const handleFiltrarPeriodo = (data) => {
    setFiltros((prev) => ({ ...prev, data: data ?? prev.data }));
  };

  const handleFiltrarDestin = (destinatario) => {
    setFiltros((prev) => ({ ...prev, destinatario: destinatario ?? prev.destinatario }));
  };

  const handleFiltrarBusca = (busca) => {
    setFiltros((prev) => ({ ...prev, busca: busca?.toLowerCase() ?? prev.busca }));
  };

  // Ordenação cliente de doações
  const doacoesOrdenadas = useMemo(() => {
    const copia = [...doacoes];
    const tipoValor = (d) => String(d?.tipo || '').toUpperCase();
    const getValorOuQuantidade = (d) => {
      if (tipoValor(d) === 'D') return Number(d?.doacao?.valor ?? d?.valor ?? 0);
      return Number(d?.doacao?.qntd ?? d?.quantidade ?? 0);
    };
    const parseData = (d) => {
      const raw = d?.data ? String(d.data) : '';
      const base = raw.length >= 10 ? raw.slice(0, 10) : raw;
      return new Date(base);
    };
    const collate = new Intl.Collator('pt-BR');
    switch (ordenacao) {
      case 'data_asc':
        return copia.sort((a, b) => parseData(a) - parseData(b));
      case 'valor_desc':
        return copia.sort((a, b) => getValorOuQuantidade(b) - getValorOuQuantidade(a));
      case 'valor_asc':
        return copia.sort((a, b) => getValorOuQuantidade(a) - getValorOuQuantidade(b));
      case 'doador_asc':
        return copia.sort((a, b) => collate.compare(String(a?.doador?.nome ?? a?.doador_nome ?? ''), String(b?.doador?.nome ?? b?.doador_nome ?? '')));
      case 'item_asc':
        return copia.sort((a, b) => collate.compare(String(a?.doacao?.item ?? a?.item ?? ''), String(b?.doacao?.item ?? b?.item ?? '')));
      case 'data_desc':
      default:
        return copia.sort((a, b) => parseData(b) - parseData(a));
    }
  }, [doacoes, ordenacao]);

  // Removido filtro por evento: interface passa a filtrar apenas por tipo, período, destinatário e busca

  return (
    <Navbar>
      <div className="content-area main-content">
        {/* Página de Cadastro de Doações */}
        {['money', 'food', 'others'].includes(tipoDoacao) && !mostraTabela && modoEdicao === false && (
          <>
            <Header ativarTabela={setMostraTabela} />
            <TipoDoacao selectTipoDoacao={setTipoDoacao} />
            {tipoDoacao === 'money' && <FormDinheiro onSave={handleSaveDoacao} />}
            {tipoDoacao === 'food' && <FormAlimentos onSave={handleSaveDoacao} />}
            {tipoDoacao === 'others' && <FormOutros onSave={handleSaveDoacao} />}
          </>
        )}
        {/* Página de Tabela de Doações */}
        {mostraTabela && (
          <>
            <HeaderTabela selectTableDoa={setMostraTabela} selectTipo={setTipoDoacao} />
            <FiltroBusca
              onTipo={handleFiltrarTipo}
              onPeriodo={handleFiltrarPeriodo}
              onDestinatario={handleFiltrarDestin}
              onBusca={handleFiltrarBusca}
              onOrdenacao={setOrdenacao}
            />
            <TabelaDoacoes
              onDelete={handleDeleteDoacao}
              onEdit={handleEditDoacao}
              doacao={doacaoToEdit}
              editando={handleChangeEditando}
              setDoacoesApp={setDoacoes}
              doacoes={doacoesOrdenadas}
            />
          </>
        )}
        {mostrarModal && doacaoToEdit?.tipo === 'D' && (
          <FormEditarDin onEdit={editDoacao} show={handleChangeEditando} doacaoEdit={doacaoToEdit} />
        )}
        {mostrarModal && doacaoToEdit?.tipo === 'A' && (
          <FormEditarAlim onEdit={editDoacao} show={handleChangeEditando} doacaoEdit={doacaoToEdit} />
        )}
        {mostrarModal && doacaoToEdit?.tipo === 'O' && (
          <FormEditarOutros onEdit={editDoacao} show={handleChangeEditando} doacaoEdit={doacaoToEdit} />
        )}
      </div>
    </Navbar>
  );
}

export default Doacoes;