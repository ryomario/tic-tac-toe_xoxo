import { IGamePlayer } from "../types"
import { GamePlayer } from "./Player"
import "./BoardCell.css"

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
  return (
    <div className="game-board-cell" {...(onClick && {role: "button", onClick})} style={{
      width: size
    }}>
      {player && <GamePlayer player={player} scale={0.75}/>}
      {showNextPlayer && <GamePlayer player={nextPlayer} scale={0.75} className="game-board-cell-next-player"/>}
    </div>
  )
}