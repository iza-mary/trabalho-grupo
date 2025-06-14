import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GerenciarQuartos from './pages/GerenciarQuartos';
import 'bootstrap-icons/font/bootstrap-icons.css';


import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <main className="content">
          <Routes>
            <Route path="/" element={<GerenciarQuartos />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
