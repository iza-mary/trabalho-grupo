/*
  Página Home (Dashboard)
  - Apresenta ações principais por módulo e métricas rápidas do sistema.
  - Filtra ações por papel do usuário e carrega métricas em paralelo.
  - Mantém UI acessível com rótulos ARIA e feedbacks visuais.
*/
import { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Navbar from '../components/Navbar';
import StatCard from '../components/dashboard/StatCard';
import ActionTile from '../components/home/ActionTile';
import { useAuth } from '../hooks/useAuth';
import { PeopleFill, DoorClosed, Building, CalendarEvent, BoxSeam, CashStack, HeartFill, GiftFill, BellFill } from 'react-bootstrap-icons';
import '../styles/Home.css';
import idosoService from '../services/idosoService';
import internacaoService from '../services/internacaoService';
import eventosService from '../services/eventosService';
import financeiroService from '../services/financeiroService';
import { listarProdutos } from '../services/produtosService';
import { obterContadores } from '../services/notificacoesService';

// Componente principal do dashboard
export default function Home() {
  const { user } = useAuth();

  // Grade de ações disponíveis por módulo; controlada por papel
  const actions = useMemo(() => ([
    { to: '/idosos', label: 'Idosos', icon: <PeopleFill />, desc: 'Listar e gerenciar idosos', variant: 'primary', roles: ['Admin', 'Funcionário'] },
    { to: '/internacoes', label: 'Internações', icon: <Building />, desc: 'Acompanhar internações ativas', variant: 'purple', roles: ['Admin', 'Funcionário'] },
    { to: '/quartos', label: 'Quartos', icon: <DoorClosed />, desc: 'Ver ocupação e disponibilidade', variant: 'teal', roles: ['Admin', 'Funcionário'] },
    { to: '/eventos', label: 'Eventos', icon: <CalendarEvent />, desc: 'Agendar e gerenciar eventos', variant: 'success', roles: ['Admin', 'Funcionário'] },
    { to: '/produtos', label: 'Estoque', icon: <BoxSeam />, desc: 'Controlar produtos e saldo', variant: 'orange', roles: ['Admin', 'Funcionário'] },
    { to: '/financeiro', label: 'Financeiro', icon: <CashStack />, desc: 'Entradas e saídas locais', variant: 'indigo', roles: ['Admin', 'Funcionário'] },
    { to: '/doacoes', label: 'Doações', icon: <GiftFill />, desc: 'Registrar e revisar doações', variant: 'pink', roles: ['Admin', 'Funcionário'] },
    { to: '/doadores', label: 'Doadores', icon: <HeartFill />, desc: 'Cadastro e histórico', variant: 'cyan', roles: ['Admin', 'Funcionário'] },
    { to: '/notificacoes', label: 'Notificações', icon: <BellFill />, desc: 'Alertas e pendências', variant: 'gray', roles: ['Admin'] },
  ]), []);

  // Aplica filtro por papel; defensivo para ausência de usuário
  const filteredActions = useMemo(() => {
    if (!user) return actions;
    return actions.filter(a => !a.roles || a.roles.includes(user.role));
  }, [actions, user]);

  // Estado de métricas exibidas no painel
  const [metricas, setMetricas] = useState({
    idososAtivos: null,
    internacoesAtivas: null,
    eventosMes: null,
    saldoFinanceiro: null,
    itensBaixa: null,
    notificacoesNaoLidas: null,
  });

  const formatBRL = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0));

  // Carrega métricas em paralelo; calcula indicadores do mês corrente
  useEffect(() => {
    let mounted = true;
    const carregarMetricas = async () => {
      try {
        // Buscar dados em paralelo
        const [idosos, internacoes, eventos, financeiro, produtos, contadores] = await Promise.all([
          idosoService.getAll().catch(() => []),
          internacaoService.listarAtivas().catch(() => []),
          eventosService.getAll().catch(() => []),
          financeiroService.list().catch(() => []),
          listarProdutos().catch(() => ({ success: false, data: [] })),
          obterContadores(user?.id).catch(() => ({ total: 0, nao_lidas: 0 })),
        ]);

        const idososAtivos = Array.isArray(idosos) ? idosos.length : 0;
        const internacoesAtivas = Array.isArray(internacoes) ? internacoes.length : 0;

        // Eventos no mês atual: conta se intervalo [dataInicio, dataFim] intersecta com o mês corrente
        const agora = new Date();
        const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
        const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);
        const parseDate = (d) => {
          if (!d) return null;
          try {
            const dt = new Date(d);
            return Number.isNaN(dt.getTime()) ? null : dt;
          } catch {
            return null;
          }
        };
        const eventosMes = Array.isArray(eventos)
          ? eventos.filter((ev) => {
              const di = parseDate(ev.dataInicio) || parseDate(ev.data_inicio) || null;
              const df = parseDate(ev.dataFim) || parseDate(ev.data_fim) || di || null;
              if (!di && !df) return false;
              const s = di ? di.getTime() : df.getTime();
              const e = df ? df.getTime() : di.getTime();
              return e >= inicioMes.getTime() && s <= fimMes.getTime();
            }).length
          : 0;

        // Saldo financeiro do mês atual: entradas - saídas, filtrando por data dentro do mês
        let entradas = 0, saidas = 0;
        const dentroDoMes = (dt) => {
          if (!dt) return false;
          const t = new Date(dt).getTime();
          return t >= inicioMes.getTime() && t <= fimMes.getTime();
        };
        if (Array.isArray(financeiro)) {
          for (const d of financeiro) {
            if (!dentroDoMes(d.data)) continue;
            const valor = Number(d.valor || 0);
            const tipoNorm = String(d.tipo || '').trim().toLowerCase();
            if (tipoNorm === 'entrada') {
              entradas += valor;
            } else if (tipoNorm === 'saída' || tipoNorm === 'saida') {
              saidas += valor;
            }
          }
        }
        const saldoFinanceiro = entradas - saidas;

        // Produtos com estoque baixo
        const listaProdutos = produtos?.success ? (produtos.data || []) : (Array.isArray(produtos) ? produtos : []);
        const itensBaixa = Array.isArray(listaProdutos)
          ? listaProdutos.filter((p) => Number(p.quantidade || 0) <= Number(p.estoque_minimo || 0)).length
          : 0;

        const notificacoesNaoLidas = Number(contadores?.nao_lidas || 0);

        if (mounted) {
          setMetricas({
            idososAtivos,
            internacoesAtivas,
            eventosMes,
            saldoFinanceiro,
            itensBaixa,
            notificacoesNaoLidas,
          });
        }
      } catch (err) {
        console.error('Erro ao carregar métricas do dashboard:', err);
      }
    };
    carregarMetricas();
    return () => { mounted = false; };
  }, [user?.id]);

  // Mapeamento das métricas para cartões exibidos
  const stats = useMemo(() => ([
    { title: 'Idosos ativos', value: metricas.idososAtivos ?? '—', icon: <PeopleFill />, variant: 'primary' },
    { title: 'Internações em andamento', value: metricas.internacoesAtivas ?? '—', icon: <DoorClosed />, variant: 'purple' },
    { title: 'Eventos este mês', value: metricas.eventosMes ?? '—', icon: <CalendarEvent />, variant: 'success' },
    { title: 'Saldo do mês', value: metricas.saldoFinanceiro != null ? formatBRL(metricas.saldoFinanceiro) : '—', icon: <CashStack />, variant: 'teal' },
    { title: 'Itens em baixa', value: metricas.itensBaixa ?? '—', icon: <BoxSeam />, variant: 'orange' },
    { title: 'Notificações não lidas', value: metricas.notificacoesNaoLidas ?? '—', icon: <BellFill />, variant: 'pink' },
  ]), [metricas]);

  return (
    <Navbar>
      <div className="home-container nav-themed-page">
        <Container fluid className="py-4 px-3 px-md-4">
          <div className="content-inner">
            <header className="welcome-header nav-themed centered" aria-live="polite">
              <h1 className="welcome-title">Bem-vindo, {user?.username || 'Usuário'}!</h1>
              <p className="welcome-subtitle">
                O SATA é um sistema de gestão integrado para instituições de acolhimento,
                reunindo cadastros de idosos, internações e quartos, agenda de eventos,
                controle de estoque e doações, além de financeiro e notificações. Tudo em
                um painel unificado, com indicadores em tempo real e operações seguras
                para a equipe.
              </p>
            </header>

            <Row className="g-3 align-items-start">
              <Col xs={12} lg={8}>
                <section aria-label="Ações principais" className="action-grid fade-in">
                  {filteredActions.map((a) => (
                    <ActionTile
                      key={a.label}
                      to={a.to}
                      label={a.label}
                      description={a.desc}
                      icon={a.icon}
                      variant={a.variant}
                      disabled={user && a.disabledFor && a.disabledFor.includes(user.role)}
                    />
                  ))}
                </section>
              </Col>
              <Col xs={12} lg={4}>
                <aside className="stats-right-column" aria-label="Métricas rápidas">
                  <section aria-label="Informações do dashboard" className="stats-grid fade-in">
                    {stats.map((s) => (
                      <StatCard key={s.title} title={s.title} value={s.value} icon={s.icon} variant={s.variant} />
                    ))}
                  </section>
                </aside>
              </Col>
            </Row>
          </div>
        </Container>
      </div>
    </Navbar>
  );
}
