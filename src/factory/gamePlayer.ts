import { IGamePlayer, IGamePlayerChance } from "../types";

export const DEFAULT_GAME_PLAYER_CHANCE: IGamePlayerChance = {
  x: '50%',
  o: '50%',
}

function parseChance(chance: `${number}%`|number) {
  let num
  try {
    if(typeof chance === 'string') {
      num = parseFloat(chance) / 100
    } else {
      num = chance
    }
    
    if(num < 0) num = 0
    if(num > 1) num = 1
  } catch (error) {
    num = 0
  }
  return num
}

export function randomPlayer(playerChance: IGamePlayerChance = DEFAULT_GAME_PLAYER_CHANCE): IGamePlayer {
  let xChance = parseChance(playerChance.x)
    ,oChance = parseChance(playerChance.o)

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