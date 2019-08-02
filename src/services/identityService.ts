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
    type: "string"
}

export default fp(async (instance: ControllerInstance, opts: { idArgs: IDParameters }, next) => {
    instance.register(identityController, opts);

    instance.get('/did', {},
        (request, reply) => reply.send(instance.idController.did()));

    instance.post('/request/authentication', { schema: { body: authReqSchema } },
        async (request, reply) => instance.idController.request.auth(request.body)
            .then(authReq => reply.send(authReq.encode()))
            .catch(error => {
                request.log.error(error);
                reply.code(500)
            }));

    instance.post('/request/payment', { schema: { body: paymentReqSchema } },
        async (request, reply) => await instance.idController.request.payment(request.body)
            .then(paymentReq => reply.send(paymentReq))
            .catch(error => {
                request.log.error(error);
                reply.code(500)
            }));

    instance.post('/validate', {},
        async (request, reply) => await instance.idController.validate(request.body)
            .then(valid => reply.code(200).send(valid ? 'true' : 'false'))
            .catch(error => {
                request.log.error(error);
                reply.code(500)
            }));

    next();
});
