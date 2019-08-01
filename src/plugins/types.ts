
import fastify = require('fastify');
import { IdentityWallet } from 'jolocom-lib/js/identityWallet/identityWallet';
import {
    JSONWebToken,
    JWTEncodable
} from 'jolocom-lib/js/interactionTokens/JSONWebToken';
import { IAuthenticationAttrs, IPaymentRequestAttrs } from 'jolocom-lib/js/interactionTokens/interactionTokens.types';
import { Authentication } from 'jolocom-lib/js/interactionTokens/authentication';


export interface InteractionStore {
    start: (token: JSONWebToken<JWTEncodable>) => void,
    findMatch: (token: JSONWebToken<JWTEncodable>) => JSONWebToken<JWTEncodable>,
    finish: (token: JSONWebToken<JWTEncodable>) => boolean
}

export interface ControllerInstance extends fastify.FastifyInstance {
    idController: {
        request: {
            auth: async (reqArgs: IAuthenticationAttrs) => Promise<Authentication>,
            payment: async (reqArgs: IPaymentRequestAttrs) => Promise<PaymentRequest>
        },
        response: {
            auth: async (reqArgs: IAuthenticationAttrs, req: JSONWebToken<JWTEncodable>) => Promise<Authentication>
        },
        isInteractionResponseValid: async (response: JSONWebToken<JWTEncodable>) => Promise<boolean>,
        getInfo: () => { date: Date, did: string }
    }
}

export interface IDParameters {
    idArgs?: { seed: Buffer; password: string }
    dep?: { endpoint: string; contract: string }
    offline: boolean
}

export interface ImplementationInstance extends fastify.FastifyInstance {
    identity: IdentityWallet,
    interactions: InteractionStore
}
