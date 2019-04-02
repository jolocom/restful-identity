import * as fastify from 'fastify';
import * as fp from 'fastify-plugin';
import identity from '../plugins/identity'
import interactions from '../plugins/interactions'

export default fp(async (instance: fastify.FastifyInstance, opts, next) =>
                  {
                    instance.register(identity);
                    instance.register(interactions);

                    instance.decorate('identity', identity);
                    instance.decorate('interactions', interactions);

                    instance.get('/info', {}, (request, reply) => {
                      try {
                        return reply.send('henlo');
                      } catch (error) {
                        request.log.error(error);
                        return reply.send(500);
                      }

                    })

                    next();
                  });
