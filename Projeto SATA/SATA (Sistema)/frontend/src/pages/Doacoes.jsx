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
import { useEffect, useMemo, useState, useCallback } from 'react';
import { formatDate } from '../utils/dateUtils';
import { useLocation } from 'react-router-dom';
import TabelaDoacoes from '../components/ComponetesDoacoes/TabelaDoacoesComp/TabelaDoacoes'
import doacoesService from '../services/doacaoService'
// Formulários de edição via rota dedicada

function Doacoes() {
  const location = useLocation();
  const [tipoDoacao, setTipoDoacao] = useState('money');
  const [mostraTabela, setMostraTabela] = useState(false);
  // Overlay removido: edição navega para /doacoes/editar/:id
  const [filtros, setFiltros] = useState({
    tipo: 'todos',
    data: 'todos',
    destinatario: 'todos',
    busca: ''
  });
  const [ordenacao, setOrdenacao] = useState('data_desc');
  const [doacoes, setDoacoes] = useState([]);
  const [buscaLocal, setBuscaLocal] = useState('');

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
        return 'Dinheiro';
      case 'alimento':
        return 'Alimento';
      case 'outros':
        return 'Outros';
      default:
        return 'todos';
    }
  };

  const reloadDoacoes = useCallback(async () => {
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
  }, [filtros]);

  useEffect(() => { reloadDoacoes(); }, [reloadDoacoes]);

  const buildPrintUrl = () => {
    const mapTipo = (t) => {
      switch (t) {
        case 'dinheiro': return 'Dinheiro';
        case 'alimento': return 'Alimento';
        case 'outros': return 'Outros';
        default: return 'todos';
      }
    };
    const params = new URLSearchParams();
    const tipo = mapTipo(filtros.tipo);
    if (tipo !== 'todos') params.set('tipo', tipo);
    if (filtros.data && filtros.data !== 'todos') params.set('data', filtros.data);
    if (filtros.destinatario && filtros.destinatario !== 'todos') params.set('destinatario', filtros.destinatario);
    if (filtros.busca) params.set('busca', filtros.busca);
    if (ordenacao) params.set('ordenacao', ordenacao);
    return `/doacoes/impressao?${params.toString()}`;
  };

  // Atualização automática: polling leve respeitando filtros e pausa durante edição
  useEffect(() => {
    const REFRESH_MS = 10000; // 10s
    let timerId = null;

    const tick = async () => {
      await reloadDoacoes();
    };

    timerId = setInterval(tick, REFRESH_MS);
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [filtros, reloadDoacoes]);

  // Abrir edição: navegação via tabela

  const handleSaveDoacao = async (doacao) => {
    const tipoUp = String(doacao?.tipo || '').toUpperCase();
    const tipoEnum = (tipoUp === 'D' || tipoUp === 'DINHEIRO')
      ? 'Dinheiro'
      : (tipoUp === 'A' || tipoUp === 'ALIMENTO')
        ? 'Alimento'
        : 'Outros';
    const doadorIdNormPre = doacao?.doador?.doadorId ?? doacao?.doador?.id ?? doacao?.doador;
    const doadorIdNumPre = Number(doadorIdNormPre);
    if (!['D','A','O','DINHEIRO','ALIMENTO','OUTROS'].includes(tipoUp)) {
      alert('Selecione um tipo de doação válido.');
      return;
    }
    if (!Number.isFinite(doadorIdNumPre) || doadorIdNumPre <= 0) {
      alert('Selecione um doador válido antes de salvar.');
      return;
    }
    if (tipoUp === 'D' || tipoUp === 'DINHEIRO') {
      const valorNum = Number(doacao?.doacao?.valor ?? doacao?.valor ?? 0);
      if (!valorNum || valorNum <= 0 || Number.isNaN(valorNum)) {
        alert('Informe um valor válido para a doação em dinheiro.');
        return;
      }
    } else if (tipoUp === 'A' || tipoUp === 'ALIMENTO') {
      const itemTxt = (doacao?.doacao?.item ?? doacao?.item ?? '').toString().trim();
      const qtdNum = Number(doacao?.doacao?.qntd ?? doacao?.qntd ?? 0);
      if (!itemTxt) { alert('Informe o Item Doado (tipo de alimento).'); return; }
      if (!qtdNum || qtdNum <= 0 || Number.isNaN(qtdNum)) { alert('Informe uma quantidade válida.'); return; }
    } else {
      const itemTxt = (doacao?.doacao?.item ?? doacao?.item ?? '').toString().trim();
      const qtdNum = Number(doacao?.doacao?.qntd ?? doacao?.qntd ?? 0);
      if (!itemTxt) { alert('Informe o Item Doado (descrição do item).'); return; }
      if (!qtdNum || qtdNum <= 0 || Number.isNaN(qtdNum)) { alert('Informe uma quantidade válida.'); return; }
    }
    // Normaliza payload para criação evitando 400 no backend
    const doadorIdNorm = doacao?.doador?.doadorId ?? doacao?.doador?.id ?? doacao?.doador;
    const payload = {
      data: typeof doacao.data === 'string' ? doacao.data : (doacao.data?.split?.('T')[0] ?? ''),
      tipo: tipoEnum,
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
          ? {
              valor: Number(doacao?.doacao?.valor ?? doacao?.valor ?? 0),
              forma_pagamento: doacao?.doacao?.forma_pagamento ?? doacao?.forma_pagamento ?? 'Dinheiro',
              comprovante: doacao?.doacao?.comprovante ?? doacao?.comprovante ?? null
            }
          : (() => {
              const item = doacao?.doacao?.item ?? doacao?.item ?? '';
              const qtd = Number(doacao?.doacao?.qntd ?? doacao?.qntd ?? 0);
              const base = {
                item,
                qntd: qtd,
                quantidade: qtd,
                unidade_medida: doacao?.doacao?.unidade_medida ?? doacao?.unidade_medida ?? 'Unidade(s)',
                produto_id: doacao?.doacao?.produto_id ?? null
              };
              if (String(doacao.tipo).toUpperCase() === 'A') {
                return { ...base, tipo_alimento: item, validade: doacao?.doacao?.validade ?? null };
              }
              return { ...base, descricao_item: item, estado_conservacao: doacao?.doacao?.estado_conservacao ?? 'Bom' };
            })()
    };

    // Atualização otimista: insere entrada temporária antes da resposta do servidor
    const tempId = `temp-${Date.now()}`;
    const tempDoacao = {
      id: tempId,
      data: payload.data + 'T03:00:00.000Z',
      tipo: payload.tipo,
      idoso: payload.idoso || '',
      doador: {
        doadorId: payload.doador.doadorId,
        nome: payload.doador.nome
      },
      evento: payload.evento,
      eventoId: payload.eventoId ?? null,
      obs: payload.obs,
      doacao:
        payload.tipo === 'D'
          ? {
              valor: payload.doacao.valor,
              forma_pagamento: payload.doacao.forma_pagamento,
              comprovante: payload.doacao.comprovante
            }
          : (String(payload.tipo).toUpperCase() === 'A' || String(payload.tipo).toUpperCase() === 'ALIMENTO')
            ? {
                tipo_alimento: payload.doacao.item,
                quantidade: payload.doacao.qntd,
                unidade_medida: payload.doacao.unidade_medida,
                validade: payload.doacao.validade
              }
            : {
                descricao_item: payload.doacao.item,
                quantidade: payload.doacao.qntd,
                unidade_medida: payload.doacao.unidade_medida,
                estado_conservacao: payload.doacao.estado_conservacao ?? 'Bom'
              }
    };

    setDoacoes((prev) => Array.isArray(prev) ? [tempDoacao, ...prev] : [tempDoacao]);
    setMostraTabela(true);

    try {
      const criada = await doacoesService.add(payload);
      setDoacoes((prev) => prev.map(d => (d.id === tempId ? criada : d)));
      await reloadDoacoes();
      console.log('Doação registrada com sucesso:', criada);
    } catch (err) {
      // Reverte otimista em caso de falha
      setDoacoes((prev) => prev.filter(d => d.id !== tempId));
      const msg = err?.response?.data?.message || err?.message || 'Falha ao registrar doação';
      console.error('Erro ao registrar doação:', msg, err);
      alert(msg);
    }
  };


  // Função de edição antiga removida

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
    setBuscaLocal(busca || '');
  };

  useEffect(() => {
    const t = setTimeout(() => {
      setFiltros((prev) => ({ ...prev, busca: (buscaLocal || '').toLowerCase() }));
    }, 300);
    return () => { if (t) clearTimeout(t); };
  }, [buscaLocal]);

  // Ordenação cliente de doações
  const doacoesOrdenadas = useMemo(() => {
    const copia = [...doacoes];
    const tipoValor = (d) => String(d?.tipo || '').toUpperCase();
    const getValorOuQuantidade = (d) => {
      if (tipoValor(d) === 'DINHEIRO' || tipoValor(d) === 'D') return Number(d?.doacao?.valor ?? d?.valor ?? 0);
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

  const normalize = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const doacoesFiltradasLocal = useMemo(() => {
    const term = normalize(buscaLocal).trim();
    if (!term) return doacoesOrdenadas;
    return doacoesOrdenadas.filter((d) => {
      const dn = normalize(d?.doador?.nome ?? d?.doador_nome ?? '');
      const tipoUpper = String(d?.tipo || '').toUpperCase();
      const tipoText = tipoUpper === 'D' ? 'dinheiro' : tipoUpper === 'A' ? 'alimento' : (tipoUpper === 'O' ? 'outros' : String(d?.tipo || ''));
      const tipo = normalize(tipoText);
      const rawDate = String(d?.data ?? '');
      const dateStr = rawDate.length >= 10 ? rawDate.slice(0, 10) : rawDate;
      const dateNorm = normalize(dateStr);
      const dateBR = normalize(formatDate(d?.data));
      const valor = d?.doacao?.valor ?? d?.valor;
      const valorStr = normalize(valor != null ? String(valor) : '');
      const obs = normalize(d?.obs ?? '');
      const item = normalize(d?.doacao?.item ?? d?.item ?? d?.tipo_alimento ?? d?.descricao_item ?? '');
      const forma = normalize(d?.doacao?.forma_pagamento ?? '');
      const comp = normalize(d?.doacao?.comprovante ?? '');
      const validadeRaw = d?.doacao?.validade ?? '';
      const validadeNorm = normalize(String(validadeRaw).slice(0, 10));
      const validadeBR = normalize(formatDate(validadeRaw));
      const estado = normalize(d?.doacao?.estado_conservacao ?? '');
      const unidade = normalize(d?.doacao?.unidade_medida ?? d?.unidade_medida ?? '');
      const idoso = normalize(d?.idoso ?? '');
      const evento = normalize(d?.evento ?? d?.evento_titulo ?? d?.eventoTitulo ?? '');
      return (
        dn.includes(term) ||
        tipo.includes(term) ||
        dateNorm.includes(term) ||
        dateBR.includes(term) ||
        valorStr.includes(term) ||
        obs.includes(term) ||
        item.includes(term) ||
        forma.includes(term) ||
        comp.includes(term) ||
        validadeNorm.includes(term) ||
        validadeBR.includes(term) ||
        estado.includes(term) ||
        unidade.includes(term) ||
        idoso.includes(term) ||
        evento.includes(term)
      );
    });
  }, [doacoesOrdenadas, buscaLocal]);

  // Removido filtro por evento: interface passa a filtrar apenas por tipo, período, destinatário e busca

  return (
    <Navbar>
      <div className="content-area main-content">
        {/* Página de Cadastro de Doações */}
        {['money', 'food', 'others'].includes(tipoDoacao) && !mostraTabela && (
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
              setDoacoesApp={setDoacoes}
              doacoes={doacoesFiltradasLocal}
              printUrl={buildPrintUrl()}
              hiddenColumns={['idoso','obs','validade']}
            />
          </>
        )}
        {/* Edição: navegação para /doacoes/editar/:id pela tabela */}
      </div>
    </Navbar>
  );
}

export default Doacoes;
