
import * as fastify from 'fastify';
import { Server, IncomingMessage, ServerResponse } from "http";
import * as parseArgs from 'minimist';
import identityService from './services/identityService';

const args = parseArgs(process.argv.slice(2), {
    string: ['seed', 'contract', 'password']
})

const dep = args.endpoint && args.contract ? {
    endpoint: args.endpoint,
    contract: args.contract.toString()
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
