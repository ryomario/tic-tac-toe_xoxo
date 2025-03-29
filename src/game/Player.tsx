import { IGamePlayer } from "../types"
import "./Player.css"

type Props = {
  player: IGamePlayer
  lineSize?: string
  size?: number|string
  position?: 'static'|'absolute'
}

export function GamePlayer({
  player,
  lineSize = '1em',
  size = "100%",
}: Props) {
  return (
    <div className={["game-player",`player-${player}`].join(" ")} style={{
      width: size,
      // @ts-ignore
      "--line-size": lineSize,
    }}><div className="game-player-ratio-helper"></div></div>
  )
}