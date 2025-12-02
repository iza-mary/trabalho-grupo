import React, { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { QuestionCircle } from 'react-bootstrap-icons';
import { useLocation } from 'react-router-dom';
import helpContent from '../../pages/helpContent';

export default function HelpButton({ pageKey, inline = false, iconOnly = true }) {
  const loc = useLocation();
  const currentKey = pageKey || loc.pathname;
  const [open, setOpen] = useState(false);
  const content = helpContent[currentKey] || helpContent['*'] || {};
  const btnClass = inline
    ? (iconOnly ? 'd-inline-flex align-items-center' : 'd-inline-flex align-items-center me-2')
    : 'help-fab d-inline-flex align-items-center';

  return (
    <>
      <Button
        variant="outline-info"
        size="sm"
        className={btnClass}
        onClick={() => setOpen(true)}
        title="Precisa de ajuda?"
        aria-label="Precisa de ajuda?"
      >
        {iconOnly ? (
          <QuestionCircle size={16} />
        ) : (
          <>
            <QuestionCircle className="me-2" size={16} />
            Precisa de ajuda?
          </>
        )}
      </Button>

      <Modal show={open} onHide={() => setOpen(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{content.title || 'Como usar esta página?'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {content.intro && <p>{content.intro}</p>}
          {Array.isArray(content.sections) && content.sections.map((sec, idx) => (
            <div key={idx} className="mb-3">
              {sec.title && <h6 className="mb-2">{sec.title}</h6>}
              {Array.isArray(sec.items) && (
                <ul className="mb-2">
                  {sec.items.map((it, i) => (
                    <li key={i}>{it}</li>
                  ))}
                </ul>
              )}
              {sec.note && <p className="text-muted small">{sec.note}</p>}
            </div>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setOpen(false)}>Fechar</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
