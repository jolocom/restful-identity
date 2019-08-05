
import * as fastify from 'fastify';
import { Server, IncomingMessage, ServerResponse } from "http";

import identityService from './services/identityService';

const server: fastify.FastifyInstance<
    Server,
    IncomingMessage,
    ServerResponse
> = fastify({
    logger: true,
    pluginTimeout: 60000
});

server.register(identityService, {
    // idArgs: {
    //     seed: Buffer.from('9'.repeat(64), 'hex'),
    //     password: 'dsakt'
    // },
    dep: {
        endpoint: 'https://r2bapi.dltstax.net/',
        contract: '0x50ee3ad2042a16c9a9b75b447947c7a7d2c53e29'
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
