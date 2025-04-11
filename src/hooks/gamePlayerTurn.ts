import { useState } from "react"
import { IGamePlayer } from "../types"
import { getNextPlayer, randomPlayer } from "../factory"

type Props = {
  initialPlayer?: IGamePlayer
}

export function useGamePlayerTurn({ initialPlayer }: Props = {}) {
  const initPlayer = () => !initialPlayer ? randomPlayer() : initialPlayer
  const [currentPlayer, setCurrentPlayer] = useState<IGamePlayer>(initPlayer)

  const setNextPlayer = () => {
    setCurrentPlayer(getNextPlayer(currentPlayer))
  }

  const resetTurn = () => {
    setCurrentPlayer(initPlayer)
  }

  return {
    currentPlayer,
    setNextPlayer,
    resetTurn,
  }
}