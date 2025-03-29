import { IGamePlayer } from "../types"
import { GamePlayer } from "./Player"
import "./BoardCell.css"

type Props = {
  player: IGamePlayer|null
  onClick?: () => void
  size?: string|number
}

export function GameBoardCell({
  player,
  onClick,
  size,
}: Props) {
  return (
    <div className="game-board-cell" {...(onClick && {role: "button", onClick})} style={{
      width: size
    }}>
      {player && <GamePlayer player={player}/>}
    </div>
  )
}