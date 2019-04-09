import * as fp from 'fastify-plugin';
import identity from '../plugins/identity';
import interactions from '../plugins/interactions';

export default fp(async (instance: any, opts: {callbackURL: string, idArgs: {seed: any, password: string}}, next) =>
                  {
                    instance.register(identity, opts.idArgs);
                    instance.register(interactions, {});

                    instance.get('/info', {},
                      async (request, reply) =>
                                 reply.send({date: new Date(),
                                             works: true,
                                             did: instance.identity.getDid()})
                    );

                    instance.get('/authenticationRequest', {},
                                 async (request, reply) => await instance.identity.getAuthRequest(opts.callbackURL)
                                 .then(authReq => {instance.interactions.start(authReq);
                                                   return authReq.encode()})
                                 .catch(error => {request.log.error(error);
                                                  return reply.code(500)})
                                 );

                    instance.post('/validateResponse', {},
                                  async (request, reply) => {
                                      const resp = instance.identity.parseJWT(request.body.token);
                                      const req = instance.interactions.findMatch(resp);
                                      await instance.identity.validateJWT(resp, req)
                                        .then(_ => {instance.interactions.finish(req);
                                                    return reply.code(204);})
                                        .catch(error => {request.log.error(error);
                                                         return reply.code(500)})
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
