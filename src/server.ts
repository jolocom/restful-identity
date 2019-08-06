
import * as fastify from 'fastify';
import * as swagger from 'fastify-swagger';
import { Server, IncomingMessage, ServerResponse } from "http";
import * as parseArgs from 'minimist';
import identityService from './services/identityService';

const args = parseArgs(process.argv.slice(2), {
    string: ['seed', 'contract', 'password']
})

const dep = args.endpoint && args.contract ? {
    endpoint: args.endpoint,
    contract: args.contract
} : undefined

const idArgs = args.seed ? {
    seed: Buffer.from(args.seed),
    password: args.password || 'secret'
} : undefined

const port = args.port || 3000

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
        tags: [
            { name: 'request', description: 'User related end-points' },
            { name: 'response', description: 'Code related end-points' }
        ]
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
