/*
  Componente ActionTile
  - Exibe um atalho clicável para ações principais do sistema.
  - Props: `to` (rota), `label`, `description`, `icon`, `variant`, `disabled`.
  - Acessibilidade: usa `aria-label`, `aria-disabled`, `tabIndex` e previne clique quando desabilitado.
  Exemplo de uso:
    <ActionTile to="/idosos" label="Idosos" description="Gerenciar" icon={<PeopleFill />} />
*/
import { Link } from 'react-router-dom';

export default function ActionTile({ to, label, description, icon, variant = 'primary', disabled = false }) {
  const classes = `action-tile tile-${variant}${disabled ? ' disabled-action' : ''}`;
  return (
    <Link
      to={to}
      className={classes}
      aria-label={`${label}. ${description || ''}`}
      aria-disabled={disabled ? 'true' : undefined}
      onClick={disabled ? (e) => e.preventDefault() : undefined}
      tabIndex={disabled ? -1 : 0}
    >
      <span className="tile-icon" aria-hidden="true">{icon}</span>
      <div className="tile-text">
        <span className="tile-label">{label}</span>
        {description && (
          <small className="tile-desc" aria-hidden="true">{description}</small>
        )}
      </div>
    </Link>
  );
}