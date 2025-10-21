import React from 'react';
import { Button } from 'react-bootstrap';

const ActionIconButton = ({
  variant = 'outline-secondary',
  size = 'sm',
  title,
  ariaLabel,
  onClick,
  className = '',
  children,
  ...rest
}) => (
  <Button
    variant={variant}
    size={size}
    title={title}
    aria-label={ariaLabel || title}
    onClick={onClick}
    className={className}
    {...rest}
  >
    {children}
  </Button>
);

export default ActionIconButton;