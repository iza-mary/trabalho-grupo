import "./sidebar.css";
import { BiGift } from "react-icons/bi";
import { Link } from "react-router-dom";

function SideBar() {
  return (
    <div className="sidebar p-3">
      <div className="d-flex align-items-center mb-4">
        <h4 className="m-0">SATA</h4>
      </div>
      <ul className="list-unstyled m-0 p-0">
        <li>
          <Link to="/doacoes" className="nav-link d-flex align-items-center">
            <BiGift size={20} className="mb-1 me-2" />
            Doações
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default SideBar;