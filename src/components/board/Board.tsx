import "./index.css"
import { GameBoardCell } from "./cell/BoardCell"
import { useMemo } from "react"
import { useGameContext } from "../../context/gameContext"

const BOARD_SIZE = '90vw'
const BOARD_MAX_SIZE = '500px'

export function GameBoard() {
  const { boardMap, currentPlayer, doTurn, willBeRemovedFromBoard } = useGameContext()

  const boardSize = useMemo(() => {
    const rowLength = boardMap.length
    const colLength = boardMap[0].length
    return {
      row: `${100/rowLength}%`,
      col: `${100/colLength}%`,
      line: `calc(min(${BOARD_SIZE},${BOARD_MAX_SIZE}) / ${rowLength} / 7.5)`,
    }
  },[boardMap])

  return (
    <>
      <div className="game-board" style={{
        width: BOARD_SIZE,
        height: BOARD_SIZE,
        maxWidth: BOARD_MAX_SIZE,
        maxHeight: BOARD_MAX_SIZE,
        fontSize: boardSize.line,
      }}>
        {boardMap.map((boardRow, row) => (
          <div key={`row-${row}`} className="game-board-row" style={{
            height: boardSize.row,
          }}>{boardRow.map((cell, col) => (
            <GameBoardCell
              key={`cell-${col}`}
              player={cell}
              {...((cell == null) && { onClick() { doTurn([col, row]) } })}
              size={boardSize.col}
              nextPlayer={currentPlayer}
              willBeRemoved={willBeRemovedFromBoard && willBeRemovedFromBoard[1] == row && willBeRemovedFromBoard[0] == col}
            />
          ))}</div>
        ))}
      </div>
    </>
  )
}