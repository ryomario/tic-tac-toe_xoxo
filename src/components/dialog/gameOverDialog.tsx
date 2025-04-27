import { createPortal } from "react-dom";
import { useGameContext } from "../../context/gameContext";
import { useCallback, useEffect, useMemo, useRef } from "react";
import "./index.css"
import { GameState } from "../../types";
import { GamePlayer } from "../player/Player";

export function GameOverDialog() {
  const { gameState, newGame, options: { isVsAI, aiPlayer },
    winnerPlayer,
  } = useGameContext()
  const isOpen = useMemo(() => gameState == GameState.over || gameState == GameState.draw,[gameState])

  const dialogRef = useRef<HTMLDialogElement>(null)

  const closeDialog = useCallback(() => dialogRef.current?.close(),[dialogRef.current])
  const openDialog = useCallback(() => dialogRef.current?.showModal(),[dialogRef.current])

  useEffect(() => {
    if(!dialogRef.current) return;
    if(isOpen) {
      openDialog()
    } else {
      closeDialog()
    }
  },[isOpen])

  return createPortal(<>
    <dialog ref={dialogRef}>
      <header>
        {(isVsAI && gameState == GameState.over && winnerPlayer == aiPlayer) && 'Game Over!'}
        {(isVsAI && gameState == GameState.over && winnerPlayer != aiPlayer) && 'You Wins!'}
        {(gameState == GameState.draw) && 'Draw!'}
        {(!isVsAI && gameState != GameState.draw) && 'Winner!'}
      </header>
      <main>
        {(isVsAI && gameState == GameState.over && winnerPlayer == aiPlayer) && 'You LOSE from AI!'}
        {(isVsAI && gameState == GameState.over && winnerPlayer != aiPlayer) && 'Congratulations, you have successfully defeated the AI.'}
        {(!isVsAI && !!winnerPlayer) && <GamePlayer player={winnerPlayer} size="100px" lineSize="15px" scale={0.8}/>}
        {(gameState == GameState.draw) && <div style={{ display: 'flex' }}>
          <GamePlayer player="o" size="100px" lineSize="15px" scale={0.8}/>
          <GamePlayer player="x" size="100px" lineSize="15px" scale={0.8}/>
        </div>}
        {(isVsAI && gameState == GameState.draw) && 'Better luck next time.'}
      </main>
      <footer>
        <button
          onClick={newGame}
        >NEW GAME</button>
      </footer>
    </dialog>
  </>,document.body)
}