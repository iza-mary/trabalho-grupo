import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SataCadastroIdosos from "./pages/SataCadastroIdosos";
import SataListaIdosos from "./pages/SataListaIdosos";
import SataInternacoes from "./pages/SataInternacoes";
import Lateral from "./components/Lateral";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/idosos" element={<Lateral><SataListaIdosos /></Lateral>} />
        <Route path="/" element={<Lateral><SataListaIdosos /></Lateral>} />
        <Route path="/cadastro" element={<Lateral><SataCadastroIdosos /></Lateral>} />
        <Route path="/editar/:id" element={<Lateral><SataCadastroIdosos /></Lateral>} />
        <Route path="/editar/:id/internacao" element={<Lateral><SataCadastroIdosos /></Lateral>} />
        <Route path="/internacoes" element={<Lateral><SataInternacoes /></Lateral>} />
      </Routes>
    </Router>
  );
}

export default App;