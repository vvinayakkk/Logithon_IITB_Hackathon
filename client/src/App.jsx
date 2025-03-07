import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Route, Routes } from 'react-router-dom'
import ItemImageCompliancePage from './pages/ItemImageCompliancePage'
import GlobeVisualization from './components/Globe'
import Restrictions from './pages/restrictions'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Routes>
      <Route path='/' element={<ItemImageCompliancePage/>} /> 
      <Route path='/restrictions' element={<Restrictions/>} />
    </Routes>
  )
}

export default App
