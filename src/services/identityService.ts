import * as fp from 'fastify-plugin';
import identityController from '../plugins/identityController';
import { IDParameters, ControllerInstance } from '../plugins/types'

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

const validateSchema = {
    additionalProperties: false,
    properties: {
        token: {
            type: "string"
        }
    },
    required: [
        "token",
    ],
    type: "object"
}

export default fp(async (instance: ControllerInstance, opts: { idArgs: IDParameters }, next) => {
    instance.register(identityController, opts);

    instance.get('/did', {},
        (request, reply) => reply.send(instance.idController.getInfo()));

    instance.get('/authentication', {},
        async (request, reply) => instance.idController.request.auth()
            .then(authReq => reply.send(authReq))
            .catch(error => {
                request.log.error(error);
                reply.code(500)
            }));

    instance.get('/payment', {},
        async (request, reply) => await instance.idController.request.payment()
            .then(paymentReq => reply.send(paymentReq))
            .catch(error => {
                request.log.error(error);
                reply.code(500)
            }));

    instance.post('/validate', {},
        async (request, reply) => await instance.idC.isInteractionResponseValid(request.body.token)
            .then(valid => { valid ? reply.code(204) : reply.code(409).send('Validation Failed') })
            .catch(error => {
                request.log.error(error);
                reply.code(500)
            }));

    next();
});
