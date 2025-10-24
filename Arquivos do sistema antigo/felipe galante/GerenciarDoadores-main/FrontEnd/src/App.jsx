import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import Lateral from './components/Lateral';
import Header from './components/Header';
import HeaderTabela from './components/HeaderTabela';
import FormDoador from './components/FormDoador';
import TabelaDoadores from './components/TabelaDoador';
import FormEditDoador from './components/FormEditDoador';
import doadorService from './services/doadorService';
import "./components/SataDoadores.css";

function App() {
  const [mostraTabela, setMostraTabela] = useState(false);
  const [doadores, setDoadores] = useState([]);
  const [cacheDoadores, setCacheDoadores] = useState([]);
  const [doadorToEdit, setDoadorToEdit] = useState(null);
  const [mostraModal, setMostraModal] = useState(false);
  const [doadorToDelete, setDoadorToDelete] = useState(null);
  const [filtros, setFiltros] = useState({ filtros: [] });

  const loadDoadores = async () => {
    const dados = await doadorService.getAll();
    setCacheDoadores(dados);
  };

  const filtrarDados = async () => {
    const dados = await doadorService.getByBusca(filtros);
    setDoadores(dados);
  };

  const handleSaveDoador = async (doador) => {
    const saved = await doadorService.add(doador);
    setDoadores([...doadores, saved]);
    loadDoadores();
  };

  const handleEditDoador = (doador) => {
    setDoadorToEdit(doador);
  };

  const handleEditar = async (doador) => {
    const edited = await doadorService.update(doador);
    setDoadores(prev => prev.map(d => d.id === edited.id ? edited : d));
  };

  const handleDeletar = (doador) => {
    setDoadorToDelete(doador.id);
  };

  const handleDeletarDoador = async () => {
    await doadorService.remove(doadorToDelete);
    await filtrarDados();
  };

  const handleFiltrar = (filtros) => {
    setFiltros(prev => ({...prev, filtros: filtros}));
  };

  useEffect(() => {
    filtrarDados();
  }, [filtros]);

  useEffect(() => {
    loadDoadores();
  }, []);

  return (
    <BrowserRouter>
      <Lateral> {/* Adicione o componente Lateral aqui */}
        <div className='content-area'>
          {!mostraTabela ? (
            <>
              <Header ativaTabela={setMostraTabela}/>
              <FormDoador doadores={cacheDoadores} onSubmit={handleSaveDoador}/>
            </>
          ) : (
            <>
              <HeaderTabela desativaTabela={setMostraTabela}/>
              <TabelaDoadores 
                setTermos={handleFiltrar} 
                handleDeletar={handleDeletar} 
                onDelete={handleDeletarDoador} 
                setDoadorEditar={handleEditDoador} 
                ativaModal={setMostraModal} 
                doadores={doadores}
              />
              {mostraModal && (
                <FormEditDoador 
                  doadores={cacheDoadores} 
                  onEdit={handleEditar} 
                  doador={doadorToEdit} 
                  ocultaModal={setMostraModal} 
                  show={mostraModal}
                />
              )}
            </>
          )}
        </div>
      </Lateral>
    </BrowserRouter>
  );
}

export default App;