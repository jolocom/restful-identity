import * as fastify from 'fastify';
import * as fp from 'fastify-plugin';

import { JolocomLib } from 'jolocom-lib';
import { IdentityWallet } from 'jolocom-lib/js/identityWallet/identityWallet';
import { IDParameters } from './types';

export default fp(async (instance: fastify.FastifyInstance, opts: IDParameters, next) => {
    const seed = opts.idArgs.seed;
    const password = opts.idArgs.password;
    delete opts.idArgs;

    const vaultedKeyProvider = new JolocomLib.KeyProvider(seed);
    const registry = JolocomLib.registries.jolocom.create();

    const identityWallet = await registry.authenticate(vaultedKeyProvider, {
        derivationPath: JolocomLib.KeyTypes.jolocomIdentityKey,
        encryptionPass: password,
    }).catch(err =>
        instance.log.error({ actor: "identity" }, err)
    ) as IdentityWallet;

    instance.decorate('identity', identityWallet)

    instance.log.info('identity established with did: ' + identityWallet.did);

    next();
});
