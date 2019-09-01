
import fastify = require('fastify');
import { IdentityWallet } from 'jolocom-lib/js/identityWallet/identityWallet';
import {
    JSONWebToken,
    JWTEncodable
} from 'jolocom-lib/js/interactionTokens/JSONWebToken';
import { IAuthenticationAttrs, IPaymentRequestAttrs } from 'jolocom-lib/js/interactionTokens/interactionTokens.types';
import { Authentication } from 'jolocom-lib/js/interactionTokens/authentication';
import { PaymentRequest } from 'jolocom-lib/js/interactionTokens/paymentRequest'
import { CredentialResponse } from 'jolocom-lib/js/interactionTokens/credentialResponse';
import { MultiResolver } from 'jolocom-lib/js/resolver';


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
            auth: (reqArgs: IAuthenticationAttrs, req: JSONWebToken<JWTEncodable>) => Promise<JSONWebToken<Authentication>>,
            keycloak: (respArgs: IKeycloakAtrrs, req: JSONWebToken<JWTEncodable>) => Promise<JSONWebToken<CredentialResponse>>

        },
        validate: (response: JSONWebToken<JWTEncodable>) => Promise<{
            validity: boolean,
            respondant: string
        }>,
        did: () => { date: string, did: string },
    }
}

export interface IDParameters {
    dep?: InfrastructureParameters
    idArgs: SecretParameters
}

export interface SecretParameters {
    seed: Buffer
    password: string
}

export interface InfrastructureParameters {
    endpoint: string
    contract: string
}

export interface DeploymentParameters {
    port: number
}

export interface ServerConfig {
    IDConfig: IDParameters
    deploymentConfig: DeploymentParameters
}

export interface ImplementationInstance extends fastify.FastifyInstance {
    identity: IdentityWallet,
    resolver: MultiResolver,
    interactions: InteractionStore
}
