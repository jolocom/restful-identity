
import * as pa from 'minimist';
import * as fs from 'fs';
import * as ini from 'ini';
import { ServerConfig } from 'plugins/types';

const getFile = (path: string): string => {
    try {
        return fs.readFileSync(path, 'utf-8')
    } catch (error) {
        return ''
    }
}

// cli overrides file
// cli can specify file

export const getConfig = (args: string[]): ServerConfig => {
    const cliArgs = pa(args, {
        string: ['seed', 'contract', 'password', 'conf']
    })

    const fileName = cliArgs.conf || '/etc/jolocom.conf'
    const { deployment, identity, backend } = ini.parse(getFile(fileName))

    const deploymentConfig = {
        port: cliArgs.port || (deployment ? deployment.port : 3000)
    }
    const dep = cliArgs.endpoint && cliArgs.contract ? {
        endpoint: cliArgs.endpoint,
        contract: cliArgs.contract
    } : backend && backend.endpoint && backend.contract ? {
        endpoint: backend.endpoint,
        contract: backend.contract
    } : undefined

    const idArgs = cliArgs.seed && cliArgs.password ? {
        seed: Buffer.from(cliArgs.seed, 'hex'),
        password: cliArgs.password
    } : identity && identity.seed && identity.password ? {
        seed: Buffer.from(identity.seed, 'hex'),
        password: identity.password
    } : undefined

    return {
        IDConfig: {
            dep,
            idArgs
        },
        deploymentConfig
    }
}
