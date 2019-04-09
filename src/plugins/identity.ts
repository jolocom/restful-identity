import * as fastify from 'fastify';
import * as fp from 'fastify-plugin';

import { JolocomLib } from 'jolocom-lib';
import { IdentityWallet } from 'jolocom-lib/js/identityWallet/identityWallet';

export default fp(async (instance: fastify.FastifyInstance, opts: {seed?: any, password: string }, next) => {
  const seed = opts.seed;
  const password = opts.password;
  delete opts.seed;
  delete opts.password;

  const vaultedKeyProvider = new JolocomLib.KeyProvider(seed, password);
  const registry = JolocomLib.registries.jolocom.create();

  const identityWallet = await registry.authenticate(vaultedKeyProvider, {
    derivationPath: JolocomLib.KeyTypes.jolocomIdentityKey,
    encryptionPass: password,
  }).catch(err =>
           instance.log.error({ actor: "identity" }, err)
          ) as IdentityWallet;

  instance.decorate('identity', {getDid: _ => identityWallet.did,
                                 getAuthRequest: async callbackURL =>
                                 await identityWallet.create.interactionTokens.request.auth({callbackURL: callbackURL}, password),
                                 getPaymentRequest: async () => {},
                                 parseJWT: token => JolocomLib.parse.interactionToken.fromJWT(token),
                                 validateJWT: async (token, oldToken?) => await identityWallet.validateJWT(token, oldToken)})

  instance.log.info('identity established with did: ' + identityWallet.did);

  next();
});
