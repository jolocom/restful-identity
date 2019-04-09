import * as fp from 'fastify-plugin';
import identity from '../plugins/identity';
import interactions from '../plugins/interactions';

export default fp(async (instance: any, opts: {callbackURL: string, idArgs: {seed: any, password: string}}, next) =>
                  {
                    instance.register(identity, opts.idArgs);
                    instance.register(interactions, {});

                    const get_info = _ => {return {date: new Date(),
                                                   works: true,
                                                   did: instance.identity.getDid()}};

                    const get_authn_req = async _ => {const req = await instance.identity.getAuthRequest(opts.callbackURL);
                                                      instance.interactions.start(req);
                                                      return req.encode();}

                    const get_payment_req = async _ => false;

                    const is_resp_valid = async response => {const resp = instance.identity.parseJWT(response);
                                                             const req = instance.interactions.findMatch(resp);
                                                             try {
                                                               await instance.identity.validateJWT(resp, req)
                                                               instance.interactions.finish(req);
                                                               return true;
                                                             } catch (err) {
                                                               instance.log.error({actor: 'identity controller'}, err);
                                                               return false;
                                                             }};

                    instance.decorate('getPaymentRequest', async _ => false);

                    instance.decorate('idC', {getInfo: get_info,
                                              getAuthenticationRequest: get_authn_req,
                                              getPaymentRequest: get_payment_req,
                                              isInteractionResponseValid: is_resp_valid});

                    next();
                  });
