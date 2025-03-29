import './App.css'
import { GameBoard } from './game'

function App() {

  return (
    <>
      <h1>Tic Tac Toe - XOXO</h1>
      <GameBoard
        size="90vw" maxSize={500}
      />
    </>
  )
}

export default App
