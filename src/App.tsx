import './App.css'
import { useGameContext } from './context/gameContext'
import { GameBoard, GamePlayer, NewGameDialog } from './components'

function App() {
  const { currentPlayer } = useGameContext()

  return (
    <>
      <h1>Tic Tac Toe - XOXO</h1>
      
      <table className="game-info">
        <tbody>
          <tr>
            <th>Current Turn</th>
            <td width={1}>:</td>
            <td><GamePlayer player={currentPlayer} size="1.5em" lineSize="0.25em" scale={1}/></td>
          </tr>
        </tbody>
      </table>

      <GameBoard />
      <NewGameDialog />
    </>
  )
}

export default App
