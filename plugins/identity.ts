import * as fastify from 'fastify';
import * as fp from 'fastify-plugin';

import { JolocomLib } from 'jolocom-lib';

export default fp(async (instance: fastify.FastifyInstance, opts: {seed: Buffer, password: string }, next) => {
  const vaultedKeyProvider = new JolocomLib.KeyProvider(opts.seed, opts.password);
  const registry = JolocomLib.registries.jolocom.create();

  await registry.authenticate(vaultedKeyProvider, {
    derivationPath: JolocomLib.KeyTypes.jolocomIdentityKey,
    encryptionPass: opts.password,
  }).then(identityWallet =>
          instance.decorate('identity', identityWallet)
         )
    .catch(err =>
           instance.log.error({ actor: "identity" }, err)
          )

  next();
})
