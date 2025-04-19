import { useCallback } from "react"
import { IGamePlayer } from "../../../types"
import { GamePlayer } from "../../player/Player"
import "./index.css"

type Props = {
  player: IGamePlayer|null
  onClick?: () => void
  size?: string|number
  nextPlayer?: IGamePlayer
}

export function GameBoardCell({
  player,
  nextPlayer,
  onClick,
  size,
}: Props) {
  const showNextPlayer = !player && !!nextPlayer
  const getScale = useCallback((p: IGamePlayer) => p == 'o' ? 0.75 : 0.6,[])
  return (
    <div className="game-board-cell" {...(onClick && {role: "button", onClick})} style={{
      width: size
    }}>
      {player && <GamePlayer player={player} scale={getScale(player)}/>}
      {showNextPlayer && <GamePlayer player={nextPlayer} scale={getScale(nextPlayer)} className="game-board-cell-next-player"/>}
    </div>
  )
}