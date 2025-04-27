import { IGamePlayer, IGamePlayerChance } from "../types";
import { parseFloatRange } from "../utils/numbers";

export const DEFAULT_GAME_PLAYER_CHANCE: IGamePlayerChance = {
  x: '50%',
  o: '50%',
}

export function randomPlayer(playerChance: IGamePlayerChance = DEFAULT_GAME_PLAYER_CHANCE): IGamePlayer {
  let xChance = parseFloatRange(playerChance.x)
    ,oChance = parseFloatRange(playerChance.o)

  if((xChance + oChance) < 1) oChance = 1 - xChance
  else if((xChance + oChance) > 1) oChance = 0

  const rand = Math.random()
  if(rand < xChance) {
    return 'x'
  }
  return 'o'
}

export function getNextPlayer(currentPlayer: IGamePlayer): IGamePlayer {
  if( currentPlayer == 'o') return 'x'
  return 'o'
}