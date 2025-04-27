import { IPercentage } from "../types"

/**
 * 
 * @param value 0% - 100% or 0 - 1
 * @returns 0 - 1
 */
export function parseFloatRange(value: IPercentage) {
  let num
  try {
    if(typeof value === 'string') {
      num = parseFloat(value) / 100
    } else {
      num = value
    }
    
    if(num < 0) num = 0
    if(num > 1) num = 1
  } catch (error) {
    num = 0
  }
  return num
}