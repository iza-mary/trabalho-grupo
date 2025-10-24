import React from 'react';
import { Table } from 'react-bootstrap';

const StandardTable = ({ children, ...props }) => (
  <Table striped hover responsive {...props}>
    {children}
  </Table>
);

export default StandardTable;