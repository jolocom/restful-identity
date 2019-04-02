import * as fastify from 'fastify';
import { Server, IncomingMessage, ServerResponse } from "http";

// utility plugins
import identity from './plugins/identity';
import interactions from './plugins/interactions';

// route/app plugin
import identityService from './services/identityService';

const server: fastify.FastifyInstance<
  Server,
  IncomingMessage,
  ServerResponse
> = fastify({logger:true});

server.register( identity, {idArgs: {seed: new Buffer('a'.repeat(64), 'hex'),
                                     password: 'secret'}});
server.register( interactions, {loki: {file: 'interactions.json',
                                       collections: ['interactions']}});
server.register( identityService, {service: {callbackURL: 'http://localhost:3000'}})

const start = async () => {
  try {
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
