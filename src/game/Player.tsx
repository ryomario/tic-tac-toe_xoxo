import { IGamePlayer, IPercentage } from "../types"
import { parseFloatRange } from "../utils/numbers"
import "./Player.css"

type Props = {
  player: IGamePlayer
  lineSize?: string
  size?: number|string
  scale?: IPercentage
  position?: 'static'|'absolute'
  className?: string|string[]
}

export function GamePlayer({
  player,
  lineSize = '1em',
  size = "100%",
  className = '',
  scale,
}: Props) {
  const classes = [
    "game-player",`player-${player}`,
  ]
  if(typeof className == 'string') {
    classes.push(className)
  } else if(Array.isArray(className)) {
    classes.push(...className)
  }

  const __scale = `${parseFloatRange(scale ?? 0.7) * 100}%`

  return (
    <div className={classes.join(" ")} style={{
      width: size,
      // @ts-ignore
      "--line-size": lineSize,
      "--scale": __scale,
    }}><div className="game-player-ratio-helper"></div></div>
  )
}