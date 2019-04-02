import * as fastify from 'fastify';
import * as fp from 'fastify-plugin';
import { Server, IncomingMessage, ServerResponse } from "http";

// route/app plugin
import { identityService } from './services/identityService';

const server: fastify.FastifyInstance<
  Server,
  IncomingMessage,
  ServerResponse
> = fastify({logger:true});

server.register( identityService )

