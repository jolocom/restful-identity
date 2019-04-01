import * as fp from 'fastify-plugin';
import * as loki from 'lokijs';

export default fp(async (fastify, opts, next) => {
  const db = new Loki('db.json');
  const interactions = db.addCollection('interactions');

  fastify.decorate('interactions', interactions);

  next();
});
