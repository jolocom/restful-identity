
import fastify = require('fastify');
import { IdentityWallet } from 'jolocom-lib/js/identityWallet/identityWallet';
import {
    JSONWebToken,
    JWTEncodable
} from 'jolocom-lib/js/interactionTokens/JSONWebToken';
import { IAuthenticationAttrs, IPaymentRequestAttrs } from 'jolocom-lib/js/interactionTokens/interactionTokens.types';
import { Authentication } from 'jolocom-lib/js/interactionTokens/authentication';
import { PaymentRequest } from 'jolocom-lib/js/interactionTokens/paymentRequest'
import { SignedCredential } from 'jolocom-lib/js/credentials/signedCredential/signedCredential';
import { CredentialResponse } from 'jolocom-lib/js/interactionTokens/credentialResponse';


export interface InteractionStore {
    start: (token: JSONWebToken<JWTEncodable>) => void,
    findMatch: (token: JSONWebToken<JWTEncodable>) => JSONWebToken<JWTEncodable>,
    finish: (token: JSONWebToken<JWTEncodable>) => boolean
}

export interface IKeycloakAtrrs {
    callbackURL: string,
    name: string,
    email: string
}

export interface ControllerInstance extends fastify.FastifyInstance {
    idController: {
        request: {
            auth: (reqArgs: IAuthenticationAttrs) => Promise<JSONWebToken<Authentication>>,
            payment: (reqArgs: IPaymentRequestAttrs) => Promise<JSONWebToken<PaymentRequest>>
        },
        response: {
            auth: (reqArgs: IAuthenticationAttrs, req: JSONWebToken<JWTEncodable>) => Promise<JSONWebToken<Authentication>>
        },
        validate: (response: JSONWebToken<JWTEncodable>) => Promise<boolean>,
        did: () => { date: Date, did: string },
        keycloak: (reqArgs: IKeycloakAtrrs) => Promise<JSONWebToken<CredentialResponse>>
    }
}

export interface IDParameters {
    idArgs?: { seed: Buffer; password: string }
    dep?: { endpoint: string; contract: string }
}

export interface ImplementationInstance extends fastify.FastifyInstance {
    identity: IdentityWallet,
    interactions: InteractionStore
}
