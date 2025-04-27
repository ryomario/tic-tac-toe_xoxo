export type IGamePlayer = 'x'|'o'

/**
 * (0% - 100%) or (0 - 1)
 */
export type IGamePlayerChance = {
  [key in IGamePlayer]: `${number}%` | number
};
