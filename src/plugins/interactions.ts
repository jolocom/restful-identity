import * as fp from 'fastify-plugin';

export default fp(async (instance, opts, next) => {
  const interactions = new Map();

  instance.decorate('interactions', {start: token => interactions.set(token.nonce, token),
                                     findMatch: token => interactions.get(token.nonce),
                                     finish: token => interactions.delete(token.nonce)});

  next();
});
