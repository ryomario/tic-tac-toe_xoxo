import { createPortal } from "react-dom";
import { useGameContext } from "../../context/gameContext";
import { useCallback, useEffect, useRef } from "react";
import "./index.css"

export function NewGameDialog() {
  const { gameState, startGame } = useGameContext()
  const isOpen = gameState == 'start'

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
        Start New Game!
      </header>
      <main></main>
      <footer>
        <button
          onClick={startGame}
        >START</button>
      </footer>
    </dialog>
  </>,document.body)
}