import * as fp from 'fastify-plugin';
import identityController from '../plugins/identityController';

export default fp(async (instance: any, opts: {callbackURL: string, idArgs: {seed: any, password: string}}, next) =>
                  {
                    instance.register(identityController, opts);

                    instance.get('/info', {},
                                 (request, reply) => reply.send(instance.idC.getInfo()));

                    instance.get('/authenticationRequest', {},
                                 async (request, reply) => await instance.idC.getAuthenticationRequest()
                                 .then(authReq => reply.send(authReq))
                                 .catch(error => {request.log.error(error);
                                                  reply.code(500)}));

                    instance.get('/paymentRequest', {},
                                 async (request, reply) => await instance.idC.getPaymentRequest()
                                 .then(paymentReq => reply.send(paymentReq))
                                 .catch(error => {request.log.error(error);
                                                  reply.code(500)}));

                    instance.post('/validateResponse', {},
                                  async (request, reply) => await instance.idC.isInteractionResponseValid(request.body.token)
                                  .then(valid => {valid ? reply.code(204) : reply.code(409).send('Validation Failed')})
                                  .catch(error => {request.log.error(error);
                                                   reply.code(500)}));

                    next();
                  });
