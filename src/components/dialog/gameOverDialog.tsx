import { createPortal } from "react-dom";
import { useGameContext } from "../../context/gameContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./index.css"
import { Select } from "./select";
import { GameState, IGameOptions } from "../../types";
import { GAME_DIFFICULTIES, GAME_MODES } from "../../factory";
import { GamePlayer } from "../player/Player";

export function GameOverDialog() {
  const { gameState, newGame, options: { isVsAI },
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
        {isVsAI && 'Game Over!'}
        {(!isVsAI && gameState == GameState.draw) && 'Draw!'}
        {(!isVsAI && gameState != GameState.draw) && 'Winner!'}
      </header>
      <main>
        {isVsAI && 'AI Wins!'}
        {(!isVsAI && !!winnerPlayer) && <GamePlayer player={winnerPlayer} size="100px" lineSize="15px" scale={0.8}/>}
        {(!isVsAI && gameState == GameState.draw) && <div style={{ display: 'flex' }}>
          <GamePlayer player="o" size="100px" lineSize="15px" scale={0.8}/>
          <GamePlayer player="x" size="100px" lineSize="15px" scale={0.8}/>
        </div>}
      </main>
      <footer>
        <button
          onClick={newGame}
        >NEW GAME</button>
      </footer>
    </dialog>
  </>,document.body)
}