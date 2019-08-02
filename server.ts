
import * as fastify from 'fastify';
import { Server, IncomingMessage, ServerResponse } from "http";

import identityService from './src/services/identityService';

const server: fastify.FastifyInstance<
    Server,
    IncomingMessage,
    ServerResponse
> = fastify({ logger: true });

server.register(identityService, {
    idArgs: {
        seed: Buffer.from('a'.repeat(64), 'hex'),
        password: 'secret'
    }
});

const start = async () => {
    try {
        await server.ready()
        await server.listen(3000, "0.0.0.0");
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
