import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Route, Routes } from 'react-router-dom'
import ItemImageCompliancePage from './pages/ItemImageCompliancePage'
import GlobeVisualization from './components/Globe'
import RegulationsSearch from './pages/RegulationsSearchPage'
import ShowRegulations from './pages/ShowRegulationsPage'
import ComplianceFormPage from './pages/ComplianceFormPage'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Routes>
      <Route path='/' element={<ItemImageCompliancePage/>} /> 
      <Route path='/globe' element={<GlobeVisualization/>} />
      <Route path="/regulations" element={<RegulationsSearch />} />
      <Route path="/regulations/:source/:destination" element={<ShowRegulations />} />
      <Route path="/compliance" element={<ComplianceFormPage/>} />
    </Routes>
  )
}

export default App
