import { createPortal } from "react-dom";
import { useGameContext } from "../../context/gameContext";
import { useCallback, useEffect, useRef, useState } from "react";
import "./index.css"
import { Select } from "./select";
import { GameState, IGameOptions } from "../../types";
import { GAME_DIFFICULTIES, GAME_MODES } from "../../factory";

export function NewGameDialog() {
  const { gameState, startGame, options: gameOptions } = useGameContext()
  const isOpen = gameState == GameState.start

  const dialogRef = useRef<HTMLDialogElement>(null)

  const [options, _setOptions] = useState<IGameOptions>({
    ...gameOptions,
  })
  const setOptions = useCallback((option: { [key in string]: any }) => _setOptions(oldOptions => ({
    ...oldOptions,
    ...option,
  })),[_setOptions])

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
      <main>
        <div className="game-options">
          <Select
            label="Mode"
            value={options.mode}
            onChange={(option) => setOptions({ mode: option.id })}
            options={GAME_MODES.map(mode => ({ id: mode, name: mode }))}
          />
          <Select
            label="Type"
            value={options.isVsAI ? 'ai' : 'friend'}
            onChange={(option) => setOptions({ isVsAI: option.id == 'ai' })}
            options={[
              {id: 'friend', name: 'Vs. Friend'},
              {id: 'ai', name: 'Vs. AI'},
            ]}
          />
          {options.isVsAI && (
            <Select
              label="Difficulty"
              value={options.difficulty}
              onChange={(option) => setOptions({ difficulty: option.id })}
              options={GAME_DIFFICULTIES.map(item => ({ id: item, name: item }))}
            />
          )}
        </div>
      </main>
      <footer>
        <button
          onClick={() => startGame(options)}
        >START</button>
      </footer>
    </dialog>
  </>,document.body)
}