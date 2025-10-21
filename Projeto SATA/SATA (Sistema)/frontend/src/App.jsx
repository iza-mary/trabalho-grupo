import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import SataCadastroIdosos from "./pages/SataCadastroIdosos";
import SataListaIdosos from "./pages/SataListaIdosos";
import SataInternacoes from "./pages/SataInternacoes";
import Doacoes from "./pages/Doacoes";
import SataDoadores from "./pages/SataDoadores";
import SataListaQuartos from "./pages/SataListaQuartos";
import SataCadastroQuartos from "./pages/SataCadastroQuartos";
import Eventos from "./pages/Eventos";
import FinanceiroLocal from "./pages/FinanceiroLocal";
import Financeiro from "./pages/Financeiro";
import Produtos from "./pages/Produtos";
import ProdutoNovo from "./pages/ProdutoNovo";
import ProdutoEditar from "./pages/ProdutoEditar";
import Notificacoes from "./pages/Notificacoes";
// Removido layout lateral; páginas usam o novo Navbar interno

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/doacoes" element={<Doacoes />} />
        <Route path="/idosos" element={<SataListaIdosos />} />
        <Route path="/doadores" element={<SataDoadores />} />
        <Route path="/quartos" element={<SataListaQuartos />} />
        <Route path="/quartos/cadastro" element={<SataCadastroQuartos />} />
        <Route path="/quartos/editar/:id" element={<SataCadastroQuartos />} />
        <Route path="/eventos" element={<Eventos />} />
        <Route path="/financeiro-local" element={<FinanceiroLocal />} />
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/produtos" element={<Produtos />} />
        <Route path="/produtos/novo" element={<ProdutoNovo />} />
        <Route path="/produtos/editar/:id" element={<ProdutoEditar />} />
        <Route path="/notificacoes" element={<Notificacoes />} />
        <Route path="/" element={<SataListaIdosos />} />
        <Route path="/cadastro" element={<SataCadastroIdosos />} />
        <Route path="/editar/:id" element={<SataCadastroIdosos />} />
        <Route path="/editar/:id/internacao" element={<SataCadastroIdosos />} />
        <Route path="/internacoes" element={<SataInternacoes />} />
      </Routes>
    </Router>
  );
}

export default App;