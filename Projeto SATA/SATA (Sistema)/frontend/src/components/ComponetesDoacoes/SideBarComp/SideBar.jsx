import "./sidebar.css";
import { BiGift } from "react-icons/bi";
import { Nav } from "react-bootstrap";


function SideBar() {
  return (
    <div className="sidebar p-3">
      <div className="d-flex align-items-center mb-4">
        <h4 className="m-0">SATA</h4>
      </div>
      <Nav className="flex-column">
        <Nav.Item>
          <Nav.Link href=""> <BiGift size={20} className="mb-1"/> Doações </Nav.Link>
        </Nav.Item>
      </Nav>
    </div>
  );
};

export default SideBar;