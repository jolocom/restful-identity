import * as fp from 'fastify-plugin';
import identity from '../plugins/identity';
import interactions from '../plugins/interactions';

import {
    IAuthenticationAttrs,
    IPaymentRequestAttrs
} from 'jolocom-lib/js/interactionTokens/interactionTokens.types'

import {
    IDParameters,
    ImplementationInstance
} from './types';
import { JWTEncodable, JSONWebToken } from 'jolocom-lib/js/interactionTokens/JSONWebToken';
import { JolocomLib } from 'jolocom-lib';

export default fp(async (instance: ImplementationInstance, opts: { idArgs: IDParameters }, next) => {
    const pass = opts.idArgs.idArgs.password
    instance.register(identity, opts.idArgs);
    instance.register(interactions, {});

    const get_info = _ => {
        return {
            date: instance.identity.didDocument.created,
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

    const get_auth_resp = async (reqArgs: IAuthenticationAttrs, req: JSONWebToken<JWTEncodable>) => {
        const resp = await instance.identity.create.interactionTokens.response.auth(reqArgs,
            pass,
            req
        )
        return resp;
    }

    const is_resp_valid = async (response: string): Promise<boolean> => {
        const resp = JolocomLib.parse.interactionToken.fromJWT(response)
        const req = instance.interactions.findMatch(resp);
        try {
            await instance.identity.validateJWT(resp, req)
            instance.interactions.finish(req);
            return true;
        } catch (err) {
            instance.log.error({ actor: 'identity controller' }, err);
            return false;
        }
    }

    instance.decorate('idController', {
        did: get_info,
        request: {
            auth: get_authn_req,
            payment: get_payment_req
        },
        response: {
            auth: get_auth_resp
        },
        validate: is_resp_valid
    });

    next();
});
