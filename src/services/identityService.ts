import * as fp from 'fastify-plugin';
import identityController from '../plugins/identityController';
import { IDParameters, ControllerInstance } from '../plugins/types'
import { JolocomLib } from 'jolocom-lib';

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
            required: ["value", "to", "gaslimit", "gasPrice"]
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
                callbackURL: {
                    type: "string"
                },
                name: {
                    type: "string"
                },
                email: {
                    type: "string"
                }
            },
            required: [
                "callbackURL",
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

const validateSchema = {
    type: "string"
}

export default fp(async (instance: ControllerInstance, opts: IDParameters, next) => {
    instance.register(identityController, opts);

    instance.get('/did', {},
        async (request, reply) => reply.send(instance.idController.did()));

    instance.post('/request/authentication', { schema: { body: authReqSchema } },
        async (request, reply) => instance.idController.request.auth(request.body)
            .then(authReq => reply.send(authReq.encode()))
            .catch(error => {
                request.log.error(error);
                reply.code(500)
            }));

    instance.post('/request/payment', { schema: { body: paymentReqSchema } },
        async (request, reply) => instance.idController.request.payment(request.body)
            .then(paymentReq => reply.send(paymentReq))
            .catch(error => {
                request.log.error(error);
                reply.code(500)
            }));

    instance.post('/response/keycloak', { schema: { body: keycloakSchema } },
        async (request, reply) =>
            instance.idController.response.keycloak(request.body.attrs,
                JolocomLib.parse.interactionToken.fromJWT(request.body.request))
                .then(creds => reply.send(creds.encode()))
                .catch(error => {
                    request.log.error(error);
                    reply.code(500)
                }));

    instance.post('/validate', { schema: { body: validateSchema } },
        async (request, reply) => instance.idController.validate(request.body)
            .then(valid => reply.code(200).send(valid ? 'true' : 'false'))
            .catch(error => {
                request.log.error(error);
                reply.code(500)
            }));

    next();
});
