import * as fp from 'fastify-plugin';

export default fp(async (fastify, opts, next) => {
  const interactions = new Map();

  fastify.decorate('interactions', {start: token => interactions.set(token.nonce, token),
                                    findMatch: token => interactions.get(token.nonce),
                                    finish: token => interactions.delete(token.nonce)});

  next();
});
