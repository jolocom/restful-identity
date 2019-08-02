import * as fastify from 'fastify';
import * as fp from 'fastify-plugin';

import axios from 'axios'

import {
    getStaxConfiguredContractsConnector,
    getStaxConfiguredStorageConnector,
    getStaxConfiguredContractsGateway
} from 'jolocom-lib-stax-connector'
import { createJolocomRegistry } from 'jolocom-lib/js/registries/jolocomRegistry'
import { ContractsAdapter } from 'jolocom-lib/js/contracts/contractsAdapter'
import { IVaultedKeyProvider } from 'jolocom-lib/js/vaultedKeyProvider/types'
import { JolocomRegistry } from 'jolocom-lib/js/registries/jolocomRegistry'
import { publicKeyToAddress } from 'jolocom-lib/js/utils/helper'
import { awaitPaymentTxConfirmation, fuelAddress, getStaxEndpoints } from 'jolocom-lib-stax-connector/js/utils'
import { HardwareKeyProvider } from 'hardware_key_provider'
import { JolocomLib } from 'jolocom-lib';
import { IDParameters } from './types';

const httpAgent = {
    getRequest: endpoint => {
        return axios.get(endpoint).then(res => res.data)
    },

    postRequest: (endpoint, headers, data) => {
        return axios.post(endpoint, data, { headers }).then(res => res.data)
    },

    headRequest: endpoint => {
        return axios
            .head(endpoint)
            .then(res => res)
            .catch(err => err)
    }
}

const get_vkp = (params?: IDParameters): IVaultedKeyProvider => {
    if (params && params.idArgs) {
        return new JolocomLib.KeyProvider(params.idArgs.seed);
    }

    try {
        return new HardwareKeyProvider();
    } catch {
        return new JolocomLib.KeyProvider(Buffer.from('a'.repeat(64), 'hex'));
    }
}

const get_infrastructure = (
    params?: IDParameters
): { vkp: IVaultedKeyProvider; reg: JolocomRegistry; password: string } => {
    return {
        vkp: get_vkp(params),
        reg: params && params.dep
            ? createJolocomRegistry({
                ethereumConnector: getStaxConfiguredContractsConnector(
                    params.dep.endpoint,
                    params.dep.contract || '0x50ee3ad2042a16c9a9b75b447947c7a7d2c53e29',
                    httpAgent
                ),
                ipfsConnector: getStaxConfiguredStorageConnector(params.dep.endpoint, httpAgent),
                contracts: {
                    gateway: getStaxConfiguredContractsGateway(params.dep.endpoint, 777, httpAgent),
                    adapter: new ContractsAdapter(777)
                }
            })
            : JolocomLib.registries.jolocom.create(),
        password: params && params.idArgs
            ? params.idArgs.password
            : 'secret'
    }
}

const fuel = async (amount: number, vkp: IVaultedKeyProvider, password: string,
    dep?: { endpoint: string, contract: string }) => {
    const publicKey = vkp.getPublicKey({
        derivationPath: JolocomLib.KeyTypes.ethereumKey,
        encryptionPass: password
    })

    return dep
        ? fuelAddress(
            getStaxEndpoints(dep.endpoint).userInfoEndpoint,
            publicKeyToAddress(publicKey),
            httpAgent,
            amount
        ).then(txHash =>
            awaitPaymentTxConfirmation(getStaxEndpoints(dep.endpoint).paymentEndpoint, txHash, httpAgent)
        )
        : JolocomLib.util.fuelKeyWithEther(publicKey)
}

export default fp(async (instance: fastify.FastifyInstance, opts: IDParameters, next) => {
    const { vkp, reg, password } = get_infrastructure(opts);
    delete opts.idArgs;

    const identityWallet = await reg.authenticate(vkp, {
        derivationPath: JolocomLib.KeyTypes.jolocomIdentityKey,
        encryptionPass: password,
    }).catch(async (err) => {
        instance.log.error({ actor: "identity" }, err)

        await fuel(1e19, vkp, password, opts.dep)
        return await reg.create(vkp, password).catch(err => instance.log.error({ actor: "identity" }, err))
    })

    if (identityWallet) {
        instance.decorate('identity', identityWallet)
        instance.log.info('identity established with did: ' + identityWallet.did);
    }

    next();
});
