import { useMemo, useState } from "react"
import { IGamePlayer } from "../types"
import { getNextPlayer, randomPlayer } from "../factory"

type Props = {
  initialPlayer?: IGamePlayer
}

export function useGamePlayerTurn({ initialPlayer }: Props = {}) {
  const [currentPlayer, setCurrentPlayer] = useState<IGamePlayer>(() => !initialPlayer ? randomPlayer() : initialPlayer)

  const nextPlayer = useMemo(() => getNextPlayer(currentPlayer),[currentPlayer])

  const setNextPlayer = () => {
    setCurrentPlayer(nextPlayer)
  }

  return {
    currentPlayer,
    nextPlayer,
    setNextPlayer,
  }
}