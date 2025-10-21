// components/Lateral.jsx
import { Nav } from "react-bootstrap";
import { BsHouseDoorFill, BsCashCoin } from "react-icons/bs";
import { Link } from "react-router-dom";
import "./Lateral.css";

const Lateral = ({ children }) => {
  return (
    <div className="d-flex">
      <div className="sidebar p-3">
        <h2 className="mb-4">SATA</h2>
        <Nav className="flex-column">
          <Nav.Item>
            <Nav.Link
              as={Link}
              to="/quartos"
              className="nav-link d-flex align-items-center"
            >
              <BsHouseDoorFill className="me-2" size={20} />
              Quartos
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              as={Link}
              to="/despesas"
              className="nav-link d-flex align-items-center"
            >
              <BsCashCoin className="me-2" size={20} />
              Despesas
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </div>

      <div className="flex-grow-1">
        {children}
      </div>
    </div>
  );
};

export default Lateral;