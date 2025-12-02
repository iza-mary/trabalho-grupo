import React from 'react';
import { Link } from 'react-router-dom';
import { JournalPlus } from 'react-bootstrap-icons';
import './BotaoRegistrarObservacao.css';

const BotaoRegistrarObservacao = ({ to, onClick, label = 'Registrar Observação', compact = false, solid = false }) => {
  const classNames = `btn btn-sm ${solid ? 'btn-pink' : 'btn-outline-pink'} d-inline-flex align-items-center gap-1`;

  if (to) {
    return (
      <Link to={to} className={classNames} title={label}>
        <JournalPlus size={20} />
        {!compact && <span>{label}</span>}
      </Link>
    );
  }
  return (
    <button type="button" className={classNames} onClick={onClick} title={label}>
      <JournalPlus size={20} />
      {!compact && <span>{label}</span>}
    </button>
  );
};

export default BotaoRegistrarObservacao;
