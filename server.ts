
import * as fastify from 'fastify';
import { config } from 'dotenv';
import { Server, IncomingMessage, ServerResponse } from "http";
import { books } from './bookList';

import libraryService from './src/services/libraryService';

config();

const server: fastify.FastifyInstance<
  Server,
  IncomingMessage,
  ServerResponse
> = fastify({logger:true});

const options = {
  bookList: books,
  idArgs: {seed: new Buffer(process.env.SEED, 'hex'),
           password: process.env.PASSWORD},
  callbackURL: 'http://localhost:3000',
}

server.register(libraryService, options);

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
