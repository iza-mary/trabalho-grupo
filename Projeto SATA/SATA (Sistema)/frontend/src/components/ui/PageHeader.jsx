import React from 'react';
import { Row, Col } from 'react-bootstrap';
import './ui.css';

const PageHeader = ({ title, icon, actions, className = '' }) => {
  const renderIcon = () => {
    if (!icon) return null;
    return React.cloneElement(icon, { className: 'me-2', 'aria-hidden': 'true' });
  };

  return (
    <Row className={`mb-4 page-header ${className}`}>
      <Col className="d-flex justify-content-between align-items-center">
        <h2 className="mb-0 page-title">
          {renderIcon()}
          {title}
        </h2>
        <div>{actions}</div>
      </Col>
    </Row>
  );
};

export default PageHeader;