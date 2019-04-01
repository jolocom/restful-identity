import * as fp from 'fastify-plugin';

import { JolocomLib } from 'jolocom-lib';

export default fp(async (fastify, opts: {seed: Buffer, password: string }, next) => {
  const vaultedKeyProvider = new JolocomLib.KeyProvider(opts.seed, opts.password);
  const registry = JolocomLib.registries.jolocom.create();

  await registry.authenticate(vaultedKeyProvider, {
    derivationPath: JolocomLib.KeyTypes.jolocomIdentityKey,
    encryptionPass: opts.password,
  }).then(identityWallet =>
          fastify.decorate('identity', identityWallet)
         )
    .catch(err =>
           fastify.log.error({ actor: "identity" }, err)
          )

  next();
})
