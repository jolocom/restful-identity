import * as fastify from 'fastify';
import * as fp from 'fastify-plugin';
import { JolocomLib } from 'jolocom-lib';
import { IDParameters } from '../plugins/types';

import {
    getInfrastructure,
    fuel
} from '../utils/infrastructure'

export default fp(async (instance: fastify.FastifyInstance, opts: IDParameters, next) => {
    const { vkp, reg, password, mRes } = getInfrastructure(opts);
    delete opts.idArgs;

    const identityWallet = await reg.authenticate(vkp, {
        derivationPath: JolocomLib.KeyTypes.jolocomIdentityKey,
        encryptionPass: password,
    }).catch(async (err) => {
        instance.log.error({ actor: "identity" }, err.toString())

        await fuel(1e19, vkp, password, opts.dep)
        return await reg.create(vkp, password).catch(err => instance.log.error({ actor: "identity" }, err))
    })

    if (identityWallet) {
        instance.decorate('identity', identityWallet)
        instance.log.info('identity established with did: ' + identityWallet.did);
        instance.decorate('resolver', mRes)
    }

    next();
});
