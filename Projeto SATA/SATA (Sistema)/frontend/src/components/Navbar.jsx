import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BsList, BsChevronLeft, BsChevronRight, BsDoorClosedFill, BsPeopleFill, BsCalendarEventFill, BsPersonFill, BsBoxArrowRight, BsKeyFill } from 'react-icons/bs';
import { Building, HeartFill, GiftFill, CashStack, BoxSeam, BellFill, HouseDoorFill } from 'react-bootstrap-icons';
import { useAuth } from '../hooks/useAuth';
import './Navbar.css';
import { Modal, Button } from 'react-bootstrap';

const Navbar = ({ children, disableSidebar = false, sidebarInactive = false, sidebarExtra = null, minimal = false, noMainPadding = false }) => {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const closeOnNavigate = () => setOpen(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  

  const handleLogout = () => {
    if (disableSidebar) return;
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      await logout();
    } finally {
      setShowLogoutConfirm(false);
      navigate('/login');
    }
  };

  useEffect(() => {
    if (disableSidebar && open) {
      setOpen(false);
    }
  }, [disableSidebar, open]);

  useEffect(() => {
    const el = document.getElementById('sidebar');
    if (!el) return;
    const stop = (e) => {
      if (!sidebarInactive) return;
      e.preventDefault();
      e.stopPropagation();
    };
    const focusables = el.querySelectorAll('a, button, input, select, textarea, [tabindex]');
    if (sidebarInactive) {
      focusables.forEach((node) => {
        const prev = node.getAttribute('tabindex');
        if (prev !== null) node.dataset.prevTabIndex = prev;
        node.setAttribute('tabindex', '-1');
        node.setAttribute('aria-disabled', 'true');
        node.addEventListener('click', stop, true);
        node.addEventListener('keydown', stop, true);
        node.addEventListener('mousedown', stop, true);
        node.addEventListener('touchstart', stop, true);
      });
    } else {
      focusables.forEach((node) => {
        const prev = node.dataset.prevTabIndex;
        if (prev !== undefined) node.setAttribute('tabindex', prev);
        else node.removeAttribute('tabindex');
        node.removeAttribute('aria-disabled');
        node.removeEventListener('click', stop, true);
        node.removeEventListener('keydown', stop, true);
        node.removeEventListener('mousedown', stop, true);
        node.removeEventListener('touchstart', stop, true);
      });
    }
    return () => {
      focusables.forEach((node) => {
        node.removeEventListener('click', stop, true);
        node.removeEventListener('keydown', stop, true);
        node.removeEventListener('mousedown', stop, true);
        node.removeEventListener('touchstart', stop, true);
      });
    };
  }, [sidebarInactive]);

  

  return (
    <div className={open ? "menu-open" : "menu-collapsed"}>

      {/* Navbar superior quando sidebar estiver desativada */}
      {disableSidebar && !minimal && (
        <header className="navbar-modern" role="navigation" aria-label="Menu superior">
          <div className="nav-left">
            <span className="brand">SATA</span>
            <ul className="nav-links">
              <li>
                <Link to="/" className="nav-item" onClick={closeOnNavigate}>
                  <HouseDoorFill className="me-2" size={18} /> <span className="label">Tela Inicial</span>
                </Link>
              </li>
              <li>
                <Link to="/quartos" className="nav-item" onClick={closeOnNavigate}>
                  <BsDoorClosedFill className="me-2" size={18} /> <span className="label">Quartos</span>
                </Link>
              </li>
              <li>
                <Link to="/idosos" className="nav-item" onClick={closeOnNavigate}>
                  <BsPeopleFill className="me-2" size={18} /> <span className="label">Idosos</span>
                </Link>
              </li>
              <li>
                <Link to="/internacoes" className="nav-item" onClick={closeOnNavigate}>
                  <Building className="me-2" size={18} /> <span className="label">Internações</span>
                </Link>
              </li>
              <li>
                <Link to="/doadores" className="nav-item" onClick={closeOnNavigate}>
                  <HeartFill className="me-2" size={18} /> <span className="label">Doadores</span>
                </Link>
              </li>
              <li>
                <Link to="/doacoes" state={{ showTable: true }} className="nav-item" onClick={closeOnNavigate} aria-label="Ir para Tabela de Doações" title="Tabela de Doações">
                  <GiftFill className="me-2" size={18} /> <span className="label">Doações</span>
                </Link>
              </li>
              <li>
                <Link to="/eventos" className="nav-item" onClick={closeOnNavigate}>
                  <BsCalendarEventFill className="me-2" size={18} /> <span className="label">Eventos</span>
                </Link>
              </li>
              <li>
                <Link to="/produtos" className="nav-item" onClick={closeOnNavigate}>
                  <BoxSeam className="me-2" size={18} /> <span className="label">Estoque</span>
                </Link>
              </li>
              {user?.role === 'Admin' && (
                <li>
                  <Link to="/notificacoes" className="nav-item" onClick={closeOnNavigate}>
                    <BellFill className="me-2" size={18} /> <span className="label">Notificações</span>
                  </Link>
                </li>
              )}
              <li>
                <Link to="/financeiro" className="nav-item" onClick={closeOnNavigate}>
                  <CashStack className="me-2" size={18} /> <span className="label">Financeiro</span>
                </Link>
              </li>
              {user?.role === 'Admin' && (
                <li>
                  <Link to="/perfis" className="nav-item" onClick={closeOnNavigate}>
                    <BsKeyFill className="me-2" size={18} /> <span className="label">Perfis</span>
                  </Link>
                </li>
              )}
            </ul>
          </div>
          <div className="nav-right">
            {user && (
              <button type="button" className="nav-item" onClick={handleLogout}>
                <BsBoxArrowRight className="me-2" size={18} /> <span className="label">Sair</span>
              </button>
            )}
          </div>
        </header>
      )}

      {/* Sidebar lateral moderna (renderiza quando não desativada) */}
      {!disableSidebar && (
        <aside
          id="sidebar"
          className={`sidebar ${open ? "open" : "collapsed"}${sidebarInactive ? ' inactive' : ''}`}
          aria-disabled={sidebarInactive ? 'true' : 'false'}
        >
          <div className="sidebar-header">
            <div className="brand">SATA</div>
            <button
              type="button"
              className="sidebar-toggle"
              aria-label={open ? "Fechar menu lateral" : "Abrir menu lateral"}
              aria-controls="sidebar"
              aria-expanded={open ? 'true' : 'false'}
              onClick={() => setOpen(!open)}
              disabled={sidebarInactive}
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
              <Link to="/" className="nav-item" onClick={closeOnNavigate}>
                <HouseDoorFill className="me-2" size={18} /> <span className="label">Tela Inicial</span>
              </Link>
            </li>
            <li>
              <Link to="/quartos" className="nav-item" onClick={closeOnNavigate}>
                <BsDoorClosedFill className="me-2" size={18} /> <span className="label">Quartos</span>
              </Link>
            </li>
            <li>
              <Link to="/idosos" className="nav-item" onClick={closeOnNavigate}>
                <BsPeopleFill className="me-2" size={18} /> <span className="label">Idosos</span>
              </Link>
            </li>
            <li>
              <Link to="/internacoes" className="nav-item" onClick={closeOnNavigate}>
                <Building className="me-2" size={18} /> <span className="label">Internações</span>
              </Link>
            </li>
            <li>
              <Link to="/doadores" className="nav-item" onClick={closeOnNavigate}>
                <HeartFill className="me-2" size={18} /> <span className="label">Doadores</span>
              </Link>
            </li>
            <li>
              <Link
                to="/doacoes"
                state={{ showTable: true }}
                className="nav-item"
                onClick={closeOnNavigate}
                aria-label="Ir para Tabela de Doações"
                title="Tabela de Doações"
              >
                <GiftFill className="me-2" size={18} /> <span className="label">Doações</span>
              </Link>
            </li>
            <li>
              <Link to="/eventos" className="nav-item" onClick={closeOnNavigate}>
                <BsCalendarEventFill className="me-2" size={18} /> <span className="label">Eventos</span>
              </Link>
            </li>
            <li>
              <Link to="/produtos" className="nav-item" onClick={closeOnNavigate}>
                <BoxSeam className="me-2" size={18} /> <span className="label">Estoque</span>
              </Link>
            </li>
            {user?.role === 'Admin' && (
              <li>
                <Link to="/notificacoes" className="nav-item" onClick={closeOnNavigate}>
                  <BellFill className="me-2" size={18} /> <span className="label">Notificações</span>
                </Link>
              </li>
            )}
            <li>
              <Link to="/financeiro" className="nav-item" onClick={closeOnNavigate}>
                <CashStack className="me-2" size={18} /> <span className="label">Financeiro</span>
              </Link>
            </li>

            {/* Alternância de tema escuro/claro */}
            

            {/* Gestão de perfis (somente Admin) */}
            {user?.role === 'Admin' && (
              <li>
                <Link to="/perfis" className="nav-item" onClick={closeOnNavigate}>
                  <BsKeyFill className="me-2" size={18} /> <span className="label">Perfis</span>
                </Link>
              </li>
            )}
          </ul>

          {/* Área inferior fixa: info do usuário e botão sair */}
          <div className="sidebar-bottom">
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
                  <div className="user-summary">Não autenticado</div>
                )}
              </div>
            </section>

            {user && (
              <button type="button" className="nav-item mt-2" onClick={handleLogout}>
                <BsBoxArrowRight className="me-2" size={18} /> <span className="label">Sair</span>
              </button>
            )}
          </div>
        </aside>
      )}

      {/* Header de controle no mobile (apenas quando sidebar existe) */}
      {!disableSidebar && (
        <div className="mobile-header d-md-none">
          <button
            className="nav-toggle"
            aria-label="Abrir menu"
            onClick={() => setOpen(true)}
          >
            <BsList size={22} />
          </button>
          <span className="brand">SATA</span>
          <button type="button" className="nav-item" aria-label="Fechar menu lateral" onClick={() => setOpen(false)}>
            <BsChevronLeft size={18} />
          </button>
          <button type="button" className="nav-item" aria-label="Abrir menu lateral" aria-controls="sidebar" aria-expanded={open ? 'true' : 'false'} onClick={() => setOpen(true)}>
            <BsChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Backdrop mobile */}
      {open && !disableSidebar && <div className="backdrop d-md-none" onClick={() => setOpen(false)} />}

      {/* Conteúdo principal */}
      <main className={`page-content nav-themed${noMainPadding ? ' no-padding' : ''}`}>
        {children}
      </main>

      {/* Confirmação de logout */}
      <Modal show={showLogoutConfirm} onHide={() => setShowLogoutConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar saída</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Deseja sair do perfil e encerrar a sessão?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLogoutConfirm(false)}>Cancelar</Button>
          <Button variant="danger" onClick={confirmLogout}>Sair</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Navbar;
/*
  Navbar
  - Barra de navegação principal com contexto do usuário e ações.
*/
