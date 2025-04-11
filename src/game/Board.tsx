import "./Board.css"
import { GameBoardCell } from "./BoardCell"
import { useMemo } from "react"
import { useGameContext } from "../context/gameContext"

const BOARD_SIZE = '90vw'
const BOARD_MAX_SIZE = 500

export function GameBoard() {
  const { boardMap, currentPlayer, doTurn } = useGameContext()

  const boardSize = useMemo(() => {
    const rowLength = boardMap.length
    const colLength = boardMap[0].length
    return {
      row: `${100/rowLength}%`,
      col: `${100/colLength}%`,
      line: `calc(${BOARD_SIZE} / ${rowLength} / 20)`,
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
          <div className="game-board-row" style={{
            height: boardSize.row,
          }}>{boardRow.map((cell, col) => (
            <GameBoardCell
              player={cell}
              {...((cell == null) && { onClick() { doTurn([col, row]) } })}
              size={boardSize.col}
              nextPlayer={currentPlayer}
            />
          ))}</div>
        ))}
      </div>
    </>
  )
}