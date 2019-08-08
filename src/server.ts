
import * as fastify from 'fastify';
import * as swagger from 'fastify-swagger';
import { Server, IncomingMessage, ServerResponse } from "http";
import identityService from './services/identityService';
import { getConfig } from './utils/config';


const serverConfig = getConfig(process.argv.slice(2))

console.log(serverConfig)

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

server.register(identityService, serverConfig.IDConfig);

const start = async () => {
    try {
        await server.ready()
        await server.listen(serverConfig.deploymentConfig.port, "0.0.0.0");
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
