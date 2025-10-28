import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DialogContext } from './dialogContextBase';
import { Modal, Button, Form } from 'react-bootstrap';

export function DialogProvider({ children }) {
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [inputValue, setInputValue] = useState('');

  // O avanço para o próximo diálogo é gerenciado pelo efeito abaixo

  useEffect(() => {
    if (!current && queue.length > 0) {
      const nextItem = queue[0];
      setQueue(old => old.slice(1));
      setInputValue(nextItem.defaultValue ?? '');
      setCurrent(nextItem);
    }
  }, [queue, current]);

  const open = useCallback((type, message, options = {}) => {
    return new Promise(resolve => {
      setQueue(q => [...q, { type, message, resolve, ...options }]);
    });
  }, []);

  // Suporta mensagens ricas (string ou JSX) sem coerção para string
  const alert = useCallback((message, options) => open('alert', message, options), [open]);
  const confirm = useCallback((message, options) => open('confirm', message, options), [open]);
  const prompt = useCallback((message, defaultValue = '', options) => open('prompt', message, { defaultValue, ...options }), [open]);

  const handleOk = useCallback(() => {
    if (!current) return;
    if (current.type === 'confirm') current.resolve(true);
    else if (current.type === 'prompt') current.resolve(inputValue);
    else current.resolve();
    setCurrent(null);
  }, [current, inputValue]);

  const handleCancel = useCallback(() => {
    if (!current) return;
    if (current.type === 'confirm') current.resolve(false);
    else if (current.type === 'prompt') current.resolve(null);
    else current.resolve();
    setCurrent(null);
  }, [current]);

  // Intercepta diálogos nativos
  useEffect(() => {
    const originalAlert = window.alert;
    const originalConfirm = window.confirm;
    const originalPrompt = window.prompt;

    window.alert = (msg) => { alert(msg); };
    window.confirm = (msg) => {
      // Mostra UI customizada, mas retorna imediatamente para evitar travar fluxo síncrono
      // Para preservar o fluxo correto, use window.confirmAsync.
      confirm(msg);
      return false;
    };
    window.prompt = (msg, def) => {
      prompt(msg, def ?? '');
      return null;
    };
    window.confirmAsync = (msg, options) => confirm(msg, options);
    window.promptAsync = (msg, def, options) => prompt(msg, def, options);

    return () => {
      window.alert = originalAlert;
      window.confirm = originalConfirm;
      window.prompt = originalPrompt;
      delete window.confirmAsync;
      delete window.promptAsync;
    };
  }, [alert, confirm, prompt]);

  const value = useMemo(() => ({ alert, confirm, prompt }), [alert, confirm, prompt]);

  const title = current?.title || (
    current?.type === 'confirm' ? 'Confirmar ação' :
    current?.type === 'prompt' ? 'Informe o valor' : 'Informação'
  );

  return (
    <DialogContext.Provider value={value}>
      {children}
      <Modal show={!!current} onHide={handleCancel} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>{current?.message}</div>
          {current?.type === 'prompt' && (
            <Form.Control
              className="mt-3"
              type={current?.inputType || 'text'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoFocus
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          {current?.type !== 'alert' && (
            <Button variant="outline-secondary" onClick={handleCancel}>Cancelar</Button>
          )}
          <Button variant="primary" onClick={handleOk}>{current?.okLabel || 'OK'}</Button>
        </Modal.Footer>
      </Modal>
    </DialogContext.Provider>
  );
}

// Observação: o hook useDialog foi movido para ./useDialog.js