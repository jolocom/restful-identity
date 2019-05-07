import * as fp from 'fastify-plugin';
import identity from '../plugins/identity';
import interactions from '../plugins/interactions';

export default fp(async (instance: any,
                         opts: {callbackURL: string,
                                idArgs: {seed: any,
                                         password: string}
                                bookList: number[]},
                         next) => {
                           instance.register(identity, opts.idArgs);
                           instance.register(interactions, {});

                           const bookIDs = opts.bookList.map(isbn => );

                           const get_info = _ => {return {date: new Date(),
                                                          did: instance.identity.getDid()}};

                           const get_authn_req = async _ => {const req = await instance.identity.getAuthRequest(opts.callbackURL);
                                                             instance.interactions.start(req);
                                                             return req.encode();}

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

                           const is_book_available = async (did: string): Promise<boolean> => {
                             return did? true : false;
                           }

                           instance.decorate('idC', {getInfo: get_info,
                                                     getAuthenticationRequest: get_authn_req,
                                                     isInteractionResponseValid: is_resp_valid});

                           next();
                         });

