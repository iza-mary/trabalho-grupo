import { useState } from 'react';
import { Form, InputGroup, Button } from 'react-bootstrap';
import { Eye, EyeSlash } from 'react-bootstrap-icons';

export default function PasswordField({
  id,
  label = 'Senha',
  value,
  onChange,
  placeholder,
  autoComplete = 'current-password',
  required = false,
  ariaRequired = false,
  disabled = false,
  groupClassName = 'mb-3',
}) {
  const [show, setShow] = useState(false);
  const inputType = show ? 'text' : 'password';
  const ariaLabel = show ? 'Ocultar senha' : 'Mostrar senha';

  const toggle = () => setShow((prev) => !prev);

  return (
    <Form.Group className={groupClassName} controlId={id}>
      {label && <Form.Label>{label}</Form.Label>}
      <InputGroup>
        <Form.Control
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          aria-required={ariaRequired}
          disabled={disabled}
        />
        <Button
          variant="outline-secondary"
          onClick={toggle}
          aria-label={ariaLabel}
          aria-controls={id}
          aria-pressed={show}
          title={ariaLabel}
        >
          {show ? <EyeSlash aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </Button>
      </InputGroup>
    </Form.Group>
  );
}