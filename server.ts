
import * as fastify from 'fastify';
import { Server, IncomingMessage, ServerResponse } from "http";

import identityService from './src/services/identityService';

const server: fastify.FastifyInstance<
  Server,
  IncomingMessage,
  ServerResponse
> = fastify({logger:true});

server.register(identityService, {callbackURL: 'http://localhost:3000',
                                  idArgs: {seed: new Buffer('a'.repeat(64), 'hex'),
                                           password: 'secret'}});

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
