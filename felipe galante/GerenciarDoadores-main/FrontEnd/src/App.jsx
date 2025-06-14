import { useEffect, useState } from 'react'
import './App.css'
import FormDoador from './Components/FormDoadorComp/FormDoador'
import Header from './Components/HeaderComp/Header'
import SideBar from './Components/SideBarComp/SideBar'
import { BrowserRouter } from 'react-router-dom'
import HeaderTabela from './Components/HeaderTabelaComp/HeaderTabela'
import doadorService from './services/doadorService'
import TabelaDoadores from "./Components/TabelaDoadoresComp/TabelaDoadores"
import FormEditDoador from './Components/FormEditDoadorComp/FormEditDoador'
function App() {

  const [mostraTabela, setMostraTabela] = useState(false);
  const [doadores, setDoadores] = useState([]);
  const [cacheDoadores, setCacheDoadores] = useState([]);
  const [doadorToEdit, setDoadorToEdit] = useState(null);
  const [mostraModal, setMostraModal] = useState(false);
  const [doadorToDelete, setDoadorToDelete] = useState(null);
  const [filtros, setFiltros] = useState({
    filtros: []
  })

  const loadDoadores = async () => {
    const dados = await doadorService.getAll();
    setCacheDoadores(dados)
  }
  const filtrarDados = async () => {
    const dados = await doadorService.getByBusca(filtros);
    setDoadores(dados)
  }

  const handleSaveDoador = async (doador) => {
    const saved = await doadorService.add(doador)
    setDoadores([...doadores, saved])
    loadDoadores();
  }


  const handleEditDoador = (doador) => {
    setDoadorToEdit(doador);
  }
  const handleEditar = async (doador) => {
    const edited = await doadorService.update(doador)
    setDoadores(prev => prev.map(d => d.id === edited.id ? edited : d))
  }

  const handleDeletar = (doador) => {
    setDoadorToDelete(doador.id)
  }
  const handleDeletarDoador = async () => {
    await doadorService.remove(doadorToDelete);
    await filtrarDados();
    alert("Doador deletado com sucesso!")
  }

  const handleFiltrar = (filtros) => {
    setFiltros(prev => ({...prev, filtros: filtros}))
  }

  useEffect(() => {
    filtrarDados();
  }, [filtros])

  useEffect(()=> {
    loadDoadores();
  }, [])

  return (
    <BrowserRouter>
      <SideBar/>
      <div className='main-content'>
       {mostraTabela === false && (<>
       <Header ativaTabela={setMostraTabela}></Header>
       <FormDoador doadores={cacheDoadores} onSubmit={handleSaveDoador}></FormDoador>
       </>)}
       {mostraTabela === true && (
        <>
        <HeaderTabela desativaTabela={setMostraTabela} ></HeaderTabela>
        <TabelaDoadores setTermos={handleFiltrar} handleDeletar={handleDeletar} onDelete={handleDeletarDoador} setDoadorEditar={handleEditDoador} ativaModal={setMostraModal} doadores={doadores}></TabelaDoadores>
        {mostraModal === true && <FormEditDoador doadores={cacheDoadores} onEdit={handleEditar} doador={doadorToEdit} ocultaModal={setMostraModal} show={mostraModal}></FormEditDoador>}
        </>
       )}
      </div>
    </BrowserRouter>
  )
}

export default App