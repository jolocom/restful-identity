import * as fp from 'fastify-plugin';
import * as loki from 'lokijs';

export default fp(async (fastify, opts: {loki: {file: string, collections: string[]}}, next) => {
  const db = new loki(opts.loki.file);

  const collections = opts.loki.collections.map(collectionName => ({[collectionName]: db.addCollection(collectionName)}))
    .reduce((acc, curr) => ({...acc, ...curr}), {});

  fastify.decorate('loki', collections);

  fastify.log.info('Created collections: ' + collections);

  next();
});
