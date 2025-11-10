import { Link } from 'react-router-dom';
// Removido Tooltip/OverlayTrigger para não exibir nuvem de texto ao passar o mouse

export default function ActionTile({ to, label, description, icon, variant = 'primary' }) {
  const content = (
    <Link
      to={to}
      className={`action-tile nav-themed tile-${variant}`}
      aria-label={`${label}. ${description}`}
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

  // Retorna conteúdo diretamente, sem tooltip/overlay
  return content;
}