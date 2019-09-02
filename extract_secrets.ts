import { readKeys } from './src/utils/secure-element'

const keys = readKeys()

if (keys) console.log(`--seed=${keys.seed} --password=${keys.password}`)
