import { Nav } from "react-bootstrap";
import { BsHouseDoorFill } from "react-icons/bs";
import { Link } from "react-router-dom";
import "./Lateral.css";

const Lateral = ({ children }) => {
  return (
    <div className="d-flex">
      {/* Sidebar */}
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
        </Nav>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-grow-1 p-3">
        {children}
      </div>
    </div>
  );
};

export default Lateral;
