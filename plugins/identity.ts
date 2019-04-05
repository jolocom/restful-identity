import * as fastify from 'fastify';
import * as fp from 'fastify-plugin';

import { JolocomLib } from 'jolocom-lib';
import { IdentityWallet } from 'jolocom-lib/js/identityWallet/identityWallet';

export default fp(async (instance: fastify.FastifyInstance, opts: {seed?: any, password: string }, next) => {
  const seed = opts.seed;
  const vaultedKeyProvider = new JolocomLib.KeyProvider(seed, opts.password);
  const registry = JolocomLib.registries.jolocom.create();

  const identityWallet = await registry.authenticate(vaultedKeyProvider, {
    derivationPath: JolocomLib.KeyTypes.jolocomIdentityKey,
    encryptionPass: opts.password,
  }).catch(err =>
           instance.log.error({ actor: "identity" }, err)
          ) as IdentityWallet;

  instance.decorate('identity', identityWallet)

  instance.log.info('identity established with did: ' + identityWallet.did);

  next();
});
