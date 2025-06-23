import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SataCadastroIdosos from "./pages/SataCadastroIdosos";
import SataListaIdosos from "./pages/SataListaIdosos";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SataListaIdosos />} />
        <Route path="/cadastro" element={<SataCadastroIdosos />} />
        <Route path="/editar/:id" element={<SataCadastroIdosos />} />
      </Routes>
    </Router>
  );
}

export default App;