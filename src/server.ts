
import * as fastify from 'fastify';
import * as swagger from 'fastify-swagger';
import { Server, IncomingMessage, ServerResponse } from "http";
import * as parseArgs from 'minimist';
import * as fs from 'fs';
import * as ini from 'ini';
import identityService from './services/identityService';

const parseConfig = (cliArgs: parseArgs.ParsedArgs, { deployment, identity, port }: { [key: string]: any }) => ({
    dep: {
        endpoint: cliArgs.endpoint || deployment.endpoint || undefined,
        contract: cliArgs.contract || deployment.contract || undefined
    },
    idArgs: {
        seed: Buffer.from(cliArgs.seed || identity.seed || 'a'.repeat(64)),
        password: cliArgs.password || identity.password || 'secret'
    },
    port: cliArgs.port || port || 3000
})

const getFile = (): string => {
    try {
        return fs.readFileSync('/etc/jolocom.conf', 'utf-8')
    } catch (error) {
        return ''
    }
}

const fileArgs = ini.parse(getFile())

const cliArgs = parseArgs(process.argv.slice(2), {
    string: ['seed', 'contract', 'password']
})

const { dep, idArgs, port } = parseConfig(cliArgs, fileArgs)

console.log({ dep, idArgs, port })

const server: fastify.FastifyInstance<
    Server,
    IncomingMessage,
    ServerResponse
> = fastify({
    logger: true,
    pluginTimeout: 120000
});

server.register(swagger, {
    exposeRoute: true,
    swagger: {
        info: {
            title: 'Restful Identity',
            description: 'RPC server for a Jolocom Identity',
            version: '1.1.2'
        },
        externalDocs: {
            url: 'https://jolocom.io',
            description: 'Find more info here'
        },
        host: 'localhost',
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
    }
})

server.register(identityService, {
    idArgs,
    dep
});

const start = async () => {
    try {
        await server.ready()
        await server.listen(port, "0.0.0.0");
    } catch (err) {
        console.log(err);
        server.log.error(err);
        process.exit(1);
    }
};

process.on("uncaughtException", error => {
    console.error(error);
});
process.on("unhandledRejection", error => {
    console.error(error);
});

start();
