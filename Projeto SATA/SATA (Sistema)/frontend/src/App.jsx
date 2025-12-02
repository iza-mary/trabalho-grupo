import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
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
import FinanceiroFicha from "./pages/FinanceiroFicha";
import Produtos from "./pages/Produtos";
import ProdutosPrint from "./pages/ProdutosPrint";
import ProdutoNovo from "./pages/ProdutoNovo";
import ProdutoEditar from "./pages/ProdutoEditar";
import Notificacoes from "./pages/Notificacoes";
import IdosoFicha from "./pages/IdosoFicha";
import ObservacoesIdoso from "./pages/ObservacoesIdoso";
import DoadorFicha from "./pages/DoadorFicha";
import ProdutoFicha from "./pages/ProdutoFicha";
import LivroCaixaPrint from "./pages/LivroCaixaPrint";
import EventosPrint from "./pages/EventosPrint";
import EventoFicha from "./pages/EventoFicha";
import DoadoresPrint from "./pages/DoadoresPrint";
import IdososPrint from "./pages/IdososPrint";
import DoacoesPrint from "./pages/DoacoesPrint";
import DoacaoFicha from "./pages/DoacaoFicha";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Register from "./pages/Register";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/ChangePassword";
import Usuarios from "./pages/Usuarios";
import Perfis from "./pages/Perfis";
import ValidateEmail from "./pages/ValidateEmail";
import DoacaoEditar from "./pages/DoacaoEditar";
// Removido layout lateral; páginas usam o novo Navbar interno

function ModalRoutes() {
  const location = useLocation();
  const background = location.state && location.state.background;
  return (
    <>
      <Routes location={background || location}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/change-password" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><ChangePassword /></ProtectedRoute>} />
        <Route path="/perfis" element={<ProtectedRoute allowedRoles={["Admin"]}><Perfis /></ProtectedRoute>} />
        <Route path="/validate-email" element={<ValidateEmail />} />
        <Route path="/doacoes" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><Doacoes /></ProtectedRoute>} />
        <Route path="/doacoes/editar/:id" element={<ProtectedRoute allowedRoles={["Admin"]}><DoacaoEditar /></ProtectedRoute>} />
        <Route path="/idosos" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><SataListaIdosos /></ProtectedRoute>} />
        <Route path="/doadores" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><SataDoadores /></ProtectedRoute>} />
        <Route path="/quartos" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><SataListaQuartos /></ProtectedRoute>} />
        <Route path="/quartos/cadastro" element={<ProtectedRoute allowedRoles={["Admin"]}><SataCadastroQuartos /></ProtectedRoute>} />
        <Route path="/quartos/editar/:id" element={<ProtectedRoute allowedRoles={["Admin"]}><SataCadastroQuartos /></ProtectedRoute>} />
        <Route path="/eventos" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><Eventos /></ProtectedRoute>} />
        <Route path="/financeiro-local" element={<ProtectedRoute allowedRoles={["Admin"]}><FinanceiroLocal /></ProtectedRoute>} />
        <Route path="/financeiro" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><Financeiro /></ProtectedRoute>} />
        <Route path="/financeiro/detalhes/:id" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><FinanceiroFicha /></ProtectedRoute>} />
        <Route path="/financeiro/impressao" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><LivroCaixaPrint /></ProtectedRoute>} />
        <Route path="/eventos/impressao" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><EventosPrint /></ProtectedRoute>} />
        <Route path="/eventos/detalhes/:id" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><EventoFicha /></ProtectedRoute>} />
        <Route path="/doadores/impressao" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><DoadoresPrint /></ProtectedRoute>} />
        <Route path="/idosos/impressao" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><IdososPrint /></ProtectedRoute>} />
        <Route path="/doacoes/impressao" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><DoacoesPrint /></ProtectedRoute>} />
        <Route path="/produtos" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><Produtos /></ProtectedRoute>} />
        <Route path="/produtos/impressao" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><ProdutosPrint /></ProtectedRoute>} />
        <Route path="/produtos/novo" element={<ProtectedRoute allowedRoles={["Admin"]}><ProdutoNovo /></ProtectedRoute>} />
        <Route path="/produtos/editar/:id" element={<ProtectedRoute allowedRoles={["Admin"]}><ProdutoEditar /></ProtectedRoute>} />
        <Route path="/produtos/detalhes/:id" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><ProdutoFicha /></ProtectedRoute>} />
        <Route path="/notificacoes" element={<ProtectedRoute allowedRoles={["Admin"]}><Notificacoes /></ProtectedRoute>} />
        <Route path="/usuarios" element={<ProtectedRoute allowedRoles={["Admin"]}><Usuarios /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><Home /></ProtectedRoute>} />
        <Route path="/cadastro" element={<ProtectedRoute allowedRoles={["Admin"]}><SataCadastroIdosos /></ProtectedRoute>} />
        <Route path="/editar/:id" element={<ProtectedRoute allowedRoles={["Admin"]}><SataCadastroIdosos /></ProtectedRoute>} />
        <Route path="/editar/:id/internacao" element={<ProtectedRoute allowedRoles={["Admin"]}><SataCadastroIdosos /></ProtectedRoute>} />
        <Route path="/internacoes" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><SataInternacoes /></ProtectedRoute>} />
        <Route path="/detalhes/:id" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><IdosoFicha /></ProtectedRoute>} />
        <Route path="/detalhes/:id/observacoes" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><ObservacoesIdoso /></ProtectedRoute>} />
        <Route path="/doadores/detalhes/:id" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><DoadorFicha /></ProtectedRoute>} />
        <Route path="/doacoes/detalhes/:id" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><DoacaoFicha /></ProtectedRoute>} />
      </Routes>
      {background && (
        <Routes>
          <Route path="/doacoes/editar/:id" element={<ProtectedRoute allowedRoles={["Admin"]}><DoacaoEditar /></ProtectedRoute>} />
        </Routes>
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <ModalRoutes />
    </Router>
  );
}

export default App;
