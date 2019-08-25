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

import { MultiResolver, createValidatingResolver, createJolocomResolver, multiResolver } from 'jolocom-lib/js/resolver';
import { jolocomEthereumResolver } from 'jolocom-lib/js/ethereum/ethereum';
import { jolocomIpfsStorageAgent } from 'jolocom-lib/js/ipfs/ipfs';
import { noValidation } from 'jolocom-lib/js/validation/validation'
import { publicKeyToDID, sha256 } from 'jolocom-lib/js/utils/crypto';

const defaultPass = 'a'.repeat(32)

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
        return JolocomLib.KeyProvider.fromSeed(params.idArgs.seed, params.idArgs.password);
    }

    try {
        return new HardwareKeyProvider();
    } catch {
        return JolocomLib.KeyProvider.fromSeed(Buffer.from('a'.repeat(64), 'hex'), defaultPass);
    }
}

const get_backend = (dep?: { endpoint: string, contract: string }): { reg: JolocomRegistry, mRes: MultiResolver } => {
    if (!dep) return { reg: createJolocomRegistry(), mRes: multiResolver }

    const ethConn = getStaxConfiguredContractsConnector(
        dep.endpoint,
        dep.contract,
        httpAgent
    )

    const ipfsConn = getStaxConfiguredStorageConnector(
        dep.endpoint,
        httpAgent
    )

    const staxRes = createValidatingResolver(createJolocomResolver(ethConn, ipfsConn), noValidation)

    return {
        reg: createJolocomRegistry({
            ethereumConnector: ethConn,
            ipfsConnector: ipfsConn,
            contracts: {
                gateway: getStaxConfiguredContractsGateway(
                    dep.endpoint,
                    777,
                    httpAgent
                ),
                adapter: new ContractsAdapter(777)
            },
            didBuilder: publicKeyToDID('stax')(sha256),
            didResolver: staxRes
        }),
        mRes: new MultiResolver({
            jolo: createValidatingResolver(createJolocomResolver(jolocomEthereumResolver, jolocomIpfsStorageAgent), noValidation),
            stax: staxRes
        })
    }
}

const get_infrastructure = (
    params?: IDParameters
): { vkp: IVaultedKeyProvider; reg: JolocomRegistry; password: string, mRes: MultiResolver } => {
    return {
        vkp: get_vkp(params),
        password: params && params.idArgs
            ? params.idArgs.password
            : defaultPass,
        ...get_backend(params && params.dep)
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
    const { vkp, reg, password, mRes } = get_infrastructure(opts);
    delete opts.idArgs;

    const identityWallet = await reg.authenticate(vkp, {
        derivationPath: JolocomLib.KeyTypes.jolocomIdentityKey,
        encryptionPass: password,
    }).catch(async (err) => {
        instance.log.error({ actor: "identity" }, err.toString())

        await fuel(1e19, vkp, password, opts.dep)
        return await reg.create(vkp, password).catch(err => instance.log.error({ actor: "identity" }, err.toString()))
    })

    if (identityWallet) {
        instance.decorate('identity', identityWallet)
        instance.log.info('identity established with did: ' + identityWallet.did);
        instance.decorate('resolver', mRes)
    }

    next();
});
