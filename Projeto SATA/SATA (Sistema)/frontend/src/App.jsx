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
import Login from "./pages/Login";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Perfil from "./pages/Perfil";
// Removido layout lateral; páginas usam o novo Navbar interno

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/perfil" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><Perfil /></ProtectedRoute>} />
        <Route path="/doacoes" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><Doacoes /></ProtectedRoute>} />
        <Route path="/idosos" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><SataListaIdosos /></ProtectedRoute>} />
        <Route path="/doadores" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><SataDoadores /></ProtectedRoute>} />
        <Route path="/quartos" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><SataListaQuartos /></ProtectedRoute>} />
        <Route path="/quartos/cadastro" element={<ProtectedRoute allowedRoles={["Admin"]}><SataCadastroQuartos /></ProtectedRoute>} />
        <Route path="/quartos/editar/:id" element={<ProtectedRoute allowedRoles={["Admin"]}><SataCadastroQuartos /></ProtectedRoute>} />
        <Route path="/eventos" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><Eventos /></ProtectedRoute>} />
        {/* FinanceiroLocal restrito a Admin */}
        <Route path="/financeiro-local" element={<ProtectedRoute allowedRoles={["Admin"]}><FinanceiroLocal /></ProtectedRoute>} />
        <Route path="/financeiro" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><Financeiro /></ProtectedRoute>} />
        <Route path="/produtos" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><Produtos /></ProtectedRoute>} />
        <Route path="/produtos/novo" element={<ProtectedRoute allowedRoles={["Admin"]}><ProdutoNovo /></ProtectedRoute>} />
        <Route path="/produtos/editar/:id" element={<ProtectedRoute allowedRoles={["Admin"]}><ProdutoEditar /></ProtectedRoute>} />
        {/* Notificações restritas a Admin */}
        <Route path="/notificacoes" element={<ProtectedRoute allowedRoles={["Admin"]}><Notificacoes /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><SataListaIdosos /></ProtectedRoute>} />
        <Route path="/cadastro" element={<ProtectedRoute allowedRoles={["Admin"]}><SataCadastroIdosos /></ProtectedRoute>} />
        <Route path="/editar/:id" element={<ProtectedRoute allowedRoles={["Admin"]}><SataCadastroIdosos /></ProtectedRoute>} />
        <Route path="/editar/:id/internacao" element={<ProtectedRoute allowedRoles={["Admin"]}><SataCadastroIdosos /></ProtectedRoute>} />
        <Route path="/internacoes" element={<ProtectedRoute allowedRoles={["Admin", "Funcionário"]}><SataInternacoes /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;