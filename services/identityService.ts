import * as fp from 'fastify-plugin';

export default fp(async (instance: any, opts: {callbackURL: string}, next) =>
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
                                     const authReq = await instance.identity.create.interactionTokens.request.auth(
                                       {callbackURL: opts.callbackURL}, 'secret');
                                     instance.loki.interactions.insert(authReq);
                                     return reply.send(authReq.encode());
                                   } catch (error) {
                                     request.log.error(error);
                                     return reply.send(500);
                                   }
                                 });

                    instance.post('/validateResponse', {},
                                  async (request, reply) => {
                                    try {
                                      const req = await instance.loki.interactions.find({})
                                      await instance.identity.validateJWT(request.body);
                                      return reply.send(202);
                                    } catch (error) {
                                      request.log.error(error);
                                      return reply.send(500);
                                    }
                                  });

                    instance.get('/paymentRequest', {},
                                 async (request, reply) => {
                                   try {
                                     return reply.send(200);
                                   } catch (error) {
                                     request.log.error(error);
                                     return reply.send(500);
                                   }
                                 });

                    instance.post('/paymentConfirmation', {},
                                  async (request, reply) => {
                                    try {
                                      return reply.send(200);
                                    } catch (error) {
                                      request.log.error(error);
                                      return reply.send(500);
                                    }
                                  });

                    next();
                  });