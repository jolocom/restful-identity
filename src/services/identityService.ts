import * as fp from 'fastify-plugin';
import identityController from '../plugins/identityController';
import { IDParameters, ControllerInstance } from '../plugins/types'
import { JolocomLib } from 'jolocom-lib';
import { CredentialRequest } from 'jolocom-lib/js/interactionTokens/credentialRequest';
import { Authentication } from 'jolocom-lib/js/interactionTokens/authentication';

const authReqSchema = {
    additionalProperties: false,
    properties: {
        callbackURL: {
            type: "string"
        },
        description: {
            type: "string"
        }
    },
    required: [
        "callbackURL",
        "description"
    ],
    type: "object"
}

const authRespSchema = {
    additionalProperties: false,
    properties: {
        request: {
            type: "string"
        },
        attrs: authReqSchema
    },
    required: [
        "request",
        "attrs"
    ],
    type: "object"
}

const paymentReqSchema = {
    additionalProperties: false,
    properties: {
        callbackURL: {
            type: "string"
        },
        description: {
            type: "string"
        },
        transactionOptions: {
            type: "object",
            properties: {
                value: {
                    type: "number"
                },
                to: {
                    type: "string"
                },
                gasLimit: {
                    type: "number"
                },
                gasPrice: {
                    type: "number"
                },
            },
            required: ["value"]
        }
    },
    required: [
        "callbackURL",
        "description",
        "transactionOptions"
    ],
    type: "object"
}

const keycloakSchema = {
    additionalProperties: false,
    properties: {
        request: {
            type: "string"
        },
        attrs: {
            properties: {
                name: {
                    type: "string"
                },
                email: {
                    type: "string"
                }
            },
            required: [
                "name",
                "email"
            ],
            type: "object"
        }
    },
    required: [
        "request",
        "attrs"
    ],
    type: "object"
}

const tokenResponseSchema = {
    "201": {
        description: 'successful call',
        type: 'object',
        properties: {
            token: { type: 'string' }
        }
    }
}

const validateSchema = {
    additionalProperties: false,
    properties: {
        token: {
            type: "string"
        }
    },
    required: [
        "token"
    ],
    type: "object"
}

const validationResponseSchema = {
    "201": {
        description: 'successful call',
        type: 'object',
        properties: {
            validity: { type: 'boolean' },
            respondant: { type: 'string' }
        }
    }
}

const didResponseSchema = {
    "201": {
        description: 'identity info',
        type: 'object',
        properties: {
            did: { type: 'string' },
            date: { type: 'string' }
        }
    }
}

export default fp(async (instance: ControllerInstance, opts: IDParameters, next) => {
    instance.register(identityController, opts);

    instance.get('/did', { schema: { response: didResponseSchema } },
        async (request, reply) => reply.code(201).send(instance.idController.did()));

    instance.post('/request/authentication', {
        schema: {
            body: authReqSchema,
            response: tokenResponseSchema
        }
    },
        async (request, reply) => instance.idController.request.auth(request.body)
            .then(authReq => reply.code(201).send({ token: authReq.encode() }))
            .catch(error => {
                request.log.error(error);
                reply.code(500)
            }));

    instance.post('/request/payment', {
        schema: {
            body: paymentReqSchema,
            response: tokenResponseSchema
        }
    },
        async (request, reply) => instance.idController.request.payment(request.body)
            .then(paymentReq => reply.code(201).send({ token: paymentReq.encode() }))
            .catch(error => {
                request.log.error(error);
                reply.code(500)
            }));

    instance.post('/response/authentication', {
        schema: {
            body: authRespSchema,
            response: tokenResponseSchema
        }
    },
        async (request, reply) => instance.idController.response.auth(request.body.attrs,
            JolocomLib.parse.interactionToken.fromJWT<Authentication>(request.body.request))
            .then(resp => reply.code(201).send({ token: resp.encode() }))
            .catch(error => {
                request.log.error(error)
                reply.code(500)
            }))

    instance.post('/response/keycloak', {
        schema: {
            body: keycloakSchema,
            response: tokenResponseSchema
        }
    },
        async (request, reply) => instance.idController.response.keycloak(request.body.attrs,
            JolocomLib.parse.interactionToken.fromJWT<CredentialRequest>(request.body.request))
            .then(creds => reply.code(201).send({ token: creds.encode() }))
            .catch(error => {
                request.log.error(error);
                reply.code(500)
            }));

    instance.post('/validate', {
        schema: {
            body: validateSchema,
            response: validationResponseSchema
        }
    },
        async (request, reply) => instance.idController.validate(JolocomLib.parse.interactionToken.fromJWT(request.body.token))
            .then(status => reply.code(201).send(status))
            .catch(error => {
                request.log.error(error);
                reply.code(500)
            }));

    next();
});
