import { readKeys } from './src/utils/secure-element'
import * as ini from 'ini'
import * as fs from 'fs'
import * as pa from 'minimist'

const fileName = pa(process.argv.slice(2), {
    string: ['file']
}).file || '/etc/jolocom.conf'

const keys = readKeys()

if (keys) {
    const file = ini.parse(fileName)

    file.identity.seed = keys.seed
    file.identity.password = keys.password

    fs.writeFileSync(fileName, ini.stringify(file))
}
