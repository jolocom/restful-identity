import * as fastify from 'fastify';
import * as fp from 'fastify-plugin';
import { JolocomLib } from 'jolocom-lib';
import { IDParameters, InfrastructureParameters } from '../plugins/types';

import {
  getInfrastructure,
  fuel
} from '../utils/infrastructure'
import { IRegistry } from 'jolocom-lib/js/registries/types';
import { IVaultedKeyProvider } from 'jolocom-lib/js/vaultedKeyProvider/types';
import { IdentityWallet } from 'jolocom-lib/js/identityWallet/identityWallet';

type AsyncFunction<T, R> = (params: T) => Promise<R>;
type InstantiationArgs = {
  reg: IRegistry,
  vkp: IVaultedKeyProvider,
  password: string,
  dep?: InfrastructureParameters
}

const simple_create = async (params: Omit<InstantiationArgs, "dep">) => params.reg.create(params.vkp, params.password)
const simple_authenticate = async (params: Omit<InstantiationArgs, "dep">) => params.reg.authenticate(params.vkp, {
  derivationPath: JolocomLib.KeyTypes.jolocomIdentityKey,
  encryptionPass: params.password
})
const simple_fuel = async (params: Omit<InstantiationArgs, "reg">) => fuel(1e19, params.vkp, params.password, params.dep)

const make_resiliant = <T, R>(toTry: AsyncFunction<T, R>) =>
  async (params: T): Promise<R> => toTry(params).catch(async (_) => make_resiliant(toTry)(params))

const resiliant_instantiate = async (p: InstantiationArgs): Promise<IdentityWallet> =>
  simple_authenticate(p)
    .catch(async (err) => err.toString().indexOf("No record for DID found.") >= 0
      ? make_resiliant(simple_fuel)(p).then(async () => make_resiliant(simple_create)(p))
      : resiliant_instantiate(p))

export default fp(async (instance: fastify.FastifyInstance, opts: IDParameters, next) => {
  const { vkp, reg, password, mRes } = getInfrastructure(opts);
  delete opts.idArgs;

  const identityWallet = await resiliant_instantiate({ reg, vkp, password, dep: opts.dep })

  if (identityWallet) {
    instance.decorate('identity', identityWallet)
    instance.log.info('identity established with did: ' + identityWallet.did);
    instance.decorate('resolver', mRes)
  }

  next();
});
