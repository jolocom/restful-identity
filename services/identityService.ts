import * as fp from 'fastify-plugin';

export default fp(async (instance: any, opts, next) =>
                  {
                    instance.get('/info', {},
                      async (request, reply) =>
                                 reply.send({date: new Date(),
                                             works: true,
                                             did: instance.identity.did})
                    );

                    instance.get('/authenticationRequest', {},
                                 async (request, reply) => {
                                   try {
                                     const req = request.body;
                                   } catch (error) {
                                     request.log.error(error);
                                     return reply.send(500)
                                   }
                                 });

                    next();
                  });
