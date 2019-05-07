import * as fp from 'fastify-plugin';
import libraryController from '../plugins/libraryController';

export default fp(async (instance: any,
                         opts: {bookList: number[],
                                callbackURL: string,
                                idArgs: {seed: any,
                                         password: string}},
                         next) => {
                           instance.register(libraryController, opts);

                           instance.get('/books', {},
                                        async (request, reply) => await instance.idC.getAuthenticationRequest()
                                        .then(authReq => reply.send(authReq))
                                        .catch(error => {request.log.error(error);
                                                         reply.code(500)}));

                           instance.get('/book/:did', {},
                                        async (request, reply) => await instance.idC.getPaymentRequest()
                                        .then(paymentReq => reply.send(paymentReq))
                                        .catch(error => {request.log.error(error);
                                                         reply.code(500)}));

                           instance.post('/getBookRentalCred/:did', {},
                                         async (request, reply) => await instance.idC.isInteractionResponseValid(request.body.token)
                                         .then(valid => {valid ? reply.code(204) : reply.code(409).send('Validation Failed')})
                                         .catch(error => {request.log.error(error);
                                                          reply.code(500)}));

                           next();
                         });
