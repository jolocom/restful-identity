import * as fp from 'fastify-plugin';
import { JolocomLib } from 'jolocom-lib';

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
                                       {callbackURL: opts.callbackURL}, 'henlmao');
                                     instance.interactions.start(authReq);
                                     return reply.send(authReq.encode());
                                   } catch (error) {
                                     request.log.error(error);
                                     return reply.code(500);
                                   }
                                 });

                    instance.post('/validateResponse', {},
                                  async (request, reply) => {
                                    try {
                                      const resp = JolocomLib.parse.interactionToken.fromJWT(request.body.token);
                                      const req = instance.interactions.findMatch(resp);
                                      await instance.identity.validateJWT(resp, req);
                                      instance.interactions.finish(req);
                                      return reply.code(202);
                                    } catch (error) {
                                      request.log.error(error);
                                      return reply.code(500);
                                    }
                                  });

                    instance.get('/paymentRequest', {},
                                 async (request, reply) => {
                                   try {
                                     return reply.code(200);
                                   } catch (error) {
                                     request.log.error(error);
                                     return reply.code(500);
                                   }
                                 });

                    instance.post('/paymentConfirmation', {},
                                  async (request, reply) => {
                                    try {
                                      return reply.code(200);
                                    } catch (error) {
                                      request.log.error(error);
                                      return reply.code(500);
                                    }
                                  });

                    next();
                  });
