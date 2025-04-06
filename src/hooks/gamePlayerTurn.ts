import { useMemo, useState } from "react"
import { IGamePlayer } from "../types"
import { getNextPlayer, randomPlayer } from "../factory"

type Props = {
  initialPlayer?: IGamePlayer
}

export function useGamePlayerTurn({ initialPlayer }: Props = {}) {
  const initPlayer = () => !initialPlayer ? randomPlayer() : initialPlayer
  const [currentPlayer, setCurrentPlayer] = useState<IGamePlayer>(initPlayer)

  const nextPlayer = useMemo(() => getNextPlayer(currentPlayer),[currentPlayer])

  const setNextPlayer = () => {
    setCurrentPlayer(nextPlayer)
  }

  const resetTurn = () => {
    setCurrentPlayer(initPlayer)
  }

  return {
    currentPlayer,
    nextPlayer,
    setNextPlayer,
    resetTurn,
  }
}