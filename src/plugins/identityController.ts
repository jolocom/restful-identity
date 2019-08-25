import * as fp from 'fastify-plugin';
import identity from '../plugins/identity';
import interactions from '../plugins/interactions';

import {
    IAuthenticationAttrs,
    IPaymentRequestAttrs
} from 'jolocom-lib/js/interactionTokens/interactionTokens.types'

import {
    IDParameters,
    ImplementationInstance,
    IKeycloakAtrrs
} from './types';
import { JWTEncodable, JSONWebToken } from 'jolocom-lib/js/interactionTokens/JSONWebToken';
import { claimsMetadata } from 'jolocom-lib';

export default fp(async (instance: ImplementationInstance, opts: IDParameters, next) => {
    const pass = (opts.idArgs && opts.idArgs.password) || 'a'.repeat(32)
    instance.register(identity, opts);
    instance.register(interactions, {});

    const get_info = _ => {
        return {
            date: instance.identity.didDocument.created.toISOString(),
            did: instance.identity.did
        }
    };

    const get_authn_req = async (reqArgs: IAuthenticationAttrs) => {
        const req = await
            instance.identity.create.interactionTokens.request.auth(
                reqArgs,
                pass
            );
        instance.interactions.start(req);
        return req;
    }

    const get_payment_req = async (reqArgs: IPaymentRequestAttrs) => {
        const req = await instance.identity.create.interactionTokens.request.payment(reqArgs,
            pass)
        instance.interactions.start(req)
        return req;
    }

    const get_auth_resp = async (respArgs: IAuthenticationAttrs, req: JSONWebToken<JWTEncodable>) => {
        const resp = await instance.identity.create.interactionTokens.response.auth(respArgs,
            pass,
            req
        )
        return resp;
    }

    const is_resp_valid = async (resp: JSONWebToken<JWTEncodable>): Promise<{
        validity: boolean,
        respondant: string
    }> => {
        const req = instance.interactions.findMatch(resp);
        try {
            await instance.identity.validateJWT(resp, req, instance.resolver)
            instance.interactions.finish(req);
            return {
                validity: true,
                respondant: resp.issuer
            }
        } catch (err) {
            instance.log.error({ actor: 'identity controller' }, err.toString());
            return {
                validity: false,
                respondant: resp.issuer
            }
        }
    }

    const get_keycloak_creds = async (respArgs: IKeycloakAtrrs, req: JSONWebToken<JWTEncodable>) =>
        instance.identity.create.interactionTokens.response.share({
            callbackURL: respArgs.callbackURL,
            suppliedCredentials: [
                await instance.identity.create.signedCredential({
                    metadata: claimsMetadata.name,
                    claim: {
                        familyName: respArgs.name,
                        givenName: respArgs.name
                    },
                    subject: instance.identity.did
                }, pass).then(cred => cred.toJSON()),
                await instance.identity.create.signedCredential({
                    metadata: claimsMetadata.emailAddress,
                    claim: {
                        email: respArgs.email
                    },
                    subject: instance.identity.did
                }, pass).then(cred => cred.toJSON())
            ]
        }, pass, req)

    instance.decorate('idController', {
        did: get_info,
        request: {
            auth: get_authn_req,
            payment: get_payment_req
        },
        response: {
            auth: get_auth_resp
        },
        validate: is_resp_valid,
        keycloak: get_keycloak_creds
    });

    next();
});
