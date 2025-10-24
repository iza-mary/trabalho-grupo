import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BsList, BsChevronLeft, BsChevronRight, BsHouseDoorFill, BsPeopleFill, BsCalendarEventFill, BsPersonFill, BsBoxArrowRight, BsKeyFill } from 'react-icons/bs';
import { Building, HeartFill, GiftFill, CashStack, BoxSeam, BellFill } from 'react-bootstrap-icons';
import { useAuth } from '../hooks/useAuth';
import './Navbar.css';

const Navbar = ({ children, disableSidebar = false, sidebarExtra = null }) => {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const closeOnNavigate = () => setOpen(false);

  const handleLogout = async () => {
    if (disableSidebar) return;
    await logout();
    navigate('/login');
  };

  // Se a sidebar estiver desativada, garantir que não fique aberta
  useEffect(() => {
    if (disableSidebar && open) {
      setOpen(false);
    }
  }, [disableSidebar, open]);

  return (
    <div className={open ? "menu-open" : ""}> 
      {/* Sidebar lateral moderna */}
      <aside id="sidebar" className={`sidebar ${open ? "open" : "collapsed"} ${disableSidebar ? "disabled" : ""}`} aria-disabled={disableSidebar ? 'true' : 'false'}>
        <div className="sidebar-header">
          <div className="brand">SATA</div>
          <button
            type="button"
            className="sidebar-toggle"
            aria-label={open ? "Fechar menu lateral" : "Abrir menu lateral"}
            aria-controls="sidebar"
            aria-expanded={open ? 'true' : 'false'}
            disabled={disableSidebar}
            aria-disabled={disableSidebar ? 'true' : 'false'}
            onClick={() => { if (!disableSidebar) setOpen(!open); }}
          >
            {open ? <BsChevronLeft size={18} /> : <BsChevronRight size={18} />}
          </button>
        </div>

        {sidebarExtra && (
          <section className="sidebar-section" aria-label="Seção adicional do menu lateral">
            <div className="sidebar-section-inner">
              {sidebarExtra}
            </div>
          </section>
        )}

        <ul className="nav-vertical">
          <li>
            <Link to="/quartos" className="nav-item" onClick={closeOnNavigate} aria-disabled={disableSidebar ? 'true' : 'false'} tabIndex={disableSidebar ? -1 : 0}>
              <BsHouseDoorFill className="me-2" size={18} /> <span className="label">Quartos</span>
            </Link>
          </li>
          <li>
            <Link to="/idosos" className="nav-item" onClick={closeOnNavigate} aria-disabled={disableSidebar ? 'true' : 'false'} tabIndex={disableSidebar ? -1 : 0}>
              <BsPeopleFill className="me-2" size={18} /> <span className="label">Idosos</span>
            </Link>
          </li>
          <li>
            <Link to="/internacoes" className="nav-item" onClick={closeOnNavigate} aria-disabled={disableSidebar ? 'true' : 'false'} tabIndex={disableSidebar ? -1 : 0}>
              <Building className="me-2" size={18} /> <span className="label">Internações</span>
            </Link>
          </li>
          <li>
            <Link to="/doadores" className="nav-item" onClick={closeOnNavigate} aria-disabled={disableSidebar ? 'true' : 'false'} tabIndex={disableSidebar ? -1 : 0}>
              <HeartFill className="me-2" size={18} /> <span className="label">Doadores</span>
            </Link>
          </li>
          <li>
            <Link
              to="/doacoes"
              state={{ showTable: true }}
              className="nav-item"
              onClick={closeOnNavigate}
              aria-disabled={disableSidebar ? 'true' : 'false'}
              tabIndex={disableSidebar ? -1 : 0}
              aria-label="Ir para Tabela de Doações"
              title="Tabela de Doações"
            >
              <GiftFill className="me-2" size={18} /> <span className="label">Doações</span>
            </Link>
          </li>
          <li>
            <Link to="/eventos" className="nav-item" onClick={closeOnNavigate} aria-disabled={disableSidebar ? 'true' : 'false'} tabIndex={disableSidebar ? -1 : 0}>
              <BsCalendarEventFill className="me-2" size={18} /> <span className="label">Eventos</span>
            </Link>
          </li>
          <li>
            <Link to="/produtos" className="nav-item" onClick={closeOnNavigate} aria-disabled={disableSidebar ? 'true' : 'false'} tabIndex={disableSidebar ? -1 : 0}>
              <BoxSeam className="me-2" size={18} /> <span className="label">Produtos</span>
            </Link>
          </li>
          <li>
            <Link to="/notificacoes" className="nav-item" onClick={closeOnNavigate} aria-disabled={disableSidebar ? 'true' : 'false'} tabIndex={disableSidebar ? -1 : 0}>
              <BellFill className="me-2" size={18} /> <span className="label">Notificações</span>
            </Link>
          </li>
          <li>
            <Link to="/financeiro" className="nav-item" onClick={closeOnNavigate} aria-disabled={disableSidebar ? 'true' : 'false'} tabIndex={disableSidebar ? -1 : 0}>
              <CashStack className="me-2" size={18} /> <span className="label">Financeiro</span>
            </Link>
          </li>

          {/* Conta: alterar senha */}
          <li>
            <Link to="/perfil" className="nav-item" onClick={closeOnNavigate} aria-disabled={disableSidebar ? 'true' : 'false'} tabIndex={disableSidebar ? -1 : 0}>
              <BsKeyFill className="me-2" size={18} /> <span className="label">Alterar senha</span>
            </Link>
          </li>
        </ul>

        {/* Área inferior fixa: info do usuário e botão sair */}
        <div className="sidebar-bottom">
          {/* Informações do usuário logado */}
          <section className="sidebar-section" aria-label="Informações do usuário">
            <div className="sidebar-section-inner" aria-live="polite">
              {user ? (
                <div className="user-summary">
                  <div className="d-flex align-items-center gap-2">
                    <BsPersonFill size={18} />
                    <span><strong>{user.username}</strong></span>
                  </div>
                  <div className="text-muted small mt-1">
                    Nível de acesso: {user.role}
                  </div>
                </div>
              ) : (
                <div className="user-summary">
                  Não autenticado
                </div>
              )}
            </div>
          </section>

          {user && (
            <button
              type="button"
              className="nav-item mt-2"
              onClick={handleLogout}
              disabled={disableSidebar}
              aria-disabled={disableSidebar ? 'true' : 'false'}
            >
              <BsBoxArrowRight className="me-2" size={18} /> <span className="label">Sair</span>
            </button>
          )}
        </div>
      </aside>

      {/* Header de controle no mobile */}
      <div className="mobile-header d-md-none">
        <button 
          className="nav-toggle" 
          aria-label="Abrir menu"
          disabled={disableSidebar}
          aria-disabled={disableSidebar ? 'true' : 'false'}
          onClick={() => { if (!disableSidebar) setOpen(true); }}
        >
          <BsList size={22} />
        </button>
        <span className="brand">SATA</span>
        <button
          type="button"
          className="nav-item"
          aria-label="Fechar menu lateral"
          disabled={disableSidebar}
          aria-disabled={disableSidebar ? 'true' : 'false'}
          onClick={() => { if (!disableSidebar) setOpen(false); }}
        >
          <BsChevronLeft size={18} />
        </button>
        <button
          type="button"
          className="nav-item"
          aria-label="Abrir menu lateral"
          aria-controls="sidebar"
          aria-expanded={open ? 'true' : 'false'}
          disabled={disableSidebar}
          aria-disabled={disableSidebar ? 'true' : 'false'}
          onClick={() => { if (!disableSidebar) setOpen(true); }}
        >
          <BsChevronRight size={18} />
        </button>
      </div>

      {/* Backdrop mobile */}
      {open && <div className="backdrop d-md-none" onClick={() => setOpen(false)} />}

      {/* Conteúdo principal */}
      <main className="page-content">
        {children}
      </main>
    </div>
  );
};

export default Navbar;