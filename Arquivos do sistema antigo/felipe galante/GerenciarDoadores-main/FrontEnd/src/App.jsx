// Aplicação principal: gerencia estados e integra views com o coordenador
import { useEffect, useState, useCallback } from 'react';
import { BrowserRouter } from 'react-router-dom';
import Lateral from './views/Lateral';
import Header from './views/Header';
import HeaderTabela from './views/HeaderTabela';
import FormDoador from './views/FormDoador';
import TabelaDoadores from './views/TabelaDoador';
import FormEditDoador from './views/FormEditDoador';
import { doadorController } from './controls/container';
import "./views/SataDoadores.css";

function App() {
  // Estados de exibição, lista e filtros
  const [mostraTabela, setMostraTabela] = useState(false);
  const [doadores, setDoadores] = useState([]);
  const [cacheDoadores, setCacheDoadores] = useState([]);
  const [doadorToEdit, setDoadorToEdit] = useState(null);
  const [mostraModal, setMostraModal] = useState(false);
  const [doadorToDelete, setDoadorToDelete] = useState(null);
  const [filtros, setFiltros] = useState({ filtros: [] });

  const loadDoadores = useCallback(async () => {
    // Carrega lista completa para auxiliar validadores de duplicidade
    const dados = await doadorController.getAll();
    setCacheDoadores(dados);
  }, []);

  const filtrarDados = useCallback(async () => {
    // Aplica filtros e atualiza tabela
    const dados = await doadorController.getByBusca(filtros);
    setDoadores(dados);
  }, [filtros]);

  const handleSaveDoador = async (doador) => {
    // Salva novo doador e atualiza listas
    const saved = await doadorController.add(doador);
    setDoadores([...doadores, saved]);
    loadDoadores();
  };

  const handleEditDoador = (doador) => {
    setDoadorToEdit(doador);
  };

  const handleEditar = async (doador) => {
    // Atualiza doador editado na lista
    const edited = await doadorController.update(doador);
    setDoadores(prev => prev.map(d => d.id === edited.id ? edited : d));
  };

  const handleDeletar = (doador) => {
    setDoadorToDelete(doador.id);
  };

  const handleDeletarDoador = async () => {
    // Remove e refaz a busca atual
    await doadorController.remove(doadorToDelete);
    await filtrarDados();
  };

  const handleFiltrar = (filtros) => {
    setFiltros(prev => ({...prev, filtros: filtros}));
  };

  useEffect(() => {
    filtrarDados();
  }, [filtrarDados]);

  useEffect(() => {
    loadDoadores();
  }, [loadDoadores]);

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