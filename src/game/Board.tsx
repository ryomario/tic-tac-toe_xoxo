import "./Board.css"
import { GameBoardCell } from "./BoardCell"
import { useGame } from "../hooks/game"
import { GamePlayer } from "./Player"
import { useMemo } from "react"

type Props = {
  size: number|string
  maxSize: number|string
}

export function GameBoard({
  size,
  maxSize = 500,
}: Props) {
  const { board, nextPlayer, nextTurn } = useGame()

  const boardSize = useMemo(() => {
    const rowLength = board.length
    const colLength = board[0].length
    return {
      row: `${100/rowLength}%`,
      col: `${100/colLength}%`,
    }
  },[board])

  return (
    <>
      <table className="game-info">
        <tr>
          <th>Current Turn</th>
          <td width={1}>:</td>
          <td><GamePlayer player={nextPlayer} size="1.5em" lineSize="0.25em" scale={1}/></td>
        </tr>
      </table>

      <div className="game-board" style={{ width: size, height: size, maxWidth: maxSize, maxHeight: maxSize }}>
        {board.map((boardRow, row) => (
          <div className="game-board-row" style={{
            height: boardSize.row,
          }}>{boardRow.map((cell, col) => (
            <GameBoardCell player={cell} {...((cell == null) && { onClick() { nextTurn([col, row]) } })} size={boardSize.col} nextPlayer={nextPlayer}/>
          ))}</div>
        ))}
      </div>
    </>
  )
}