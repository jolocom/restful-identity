import * as fastify from 'fastify';
import {JolocomLib} from 'jolocom-lib';
import identityService from '../../src/services/identityService';
import * as supertest from 'supertest'
import { IdentityWallet } from 'jolocom-lib/js/identityWallet/identityWallet';
import { Server, IncomingMessage, ServerResponse } from "http";
import { Authentication } from 'jolocom-lib/js/interactionTokens/authentication';
import { CredentialShareRequestCreationArgs } from 'jolocom-lib/js/identityWallet/types';
import { CredentialResponse } from 'jolocom-lib/js/interactionTokens/credentialResponse';
import { JSONWebToken } from 'jolocom-lib/js/interactionTokens/JSONWebToken';
import { CredentialRequest } from 'jolocom-lib/js/interactionTokens/credentialRequest';

const seed = new Buffer('b'.repeat(64), 'hex');
const pword = 'henlmao';
const vkp = JolocomLib.KeyProvider.fromSeed(seed, pword);

const reg = JolocomLib.registries.jolocom.create();

// const url = 'raspberrypi.local:3000';
const url = 'http://localhost:3000'

const tester = supertest(url)

const fastify_instance: fastify.FastifyInstance<
  Server,
  IncomingMessage,
  ServerResponse
> = fastify({logger:true});

fastify_instance.register(identityService);

const basicAttrs = {callbackURL: 'https://google.com',
                    description: 'test description'}

const credReqAttrs: CredentialShareRequestCreationArgs = {
    callbackURL: 'https://google.com',
    credentialRequirements: [
        {
            type: ['name'],
            constraints: [{}]
        },
        {
            type: ['email'],
            constraints: [{}]
        }
    ]
}

let idw: IdentityWallet;
let kcToken: JSONWebToken<CredentialRequest>;
let kcBody;
let authReqBody;

const load = (testr: supertest.SuperTest<supertest.Test>) => endpoint => async (body) =>
    testr.post(endpoint)
    .send(body)
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(201)

const authReq = load(tester)('/request/authentication')
const authResp = load(tester)('/response/authentication')
const keycloak = load(tester)('/response/keycloak')
const validity = load(tester)('/validate')

const doAuthFlow = (ident: IdentityWallet) => async (authAttrs) => {
    const {body: {token: val}} = await authReq(authAttrs)
    const token = JolocomLib.parse.interactionToken.fromJWT<Authentication>(val)
    const response = await ident.create.interactionTokens.response.auth(authAttrs, pword, token)
    return validity({token: response.encode()}) }

const doAllFlows = (ident: IdentityWallet) => async (authAttrs, authRespToken, kcToken) =>
    Promise.all([
        doAuthFlow(ident)(authAttrs),
        keycloak(kcToken),
        authResp(authRespToken)
    ])

describe('identity interaction integration test', () => {
  beforeAll(async () => {
    jest.setTimeout(100000);

    await fastify_instance.ready();

    idw = await reg.authenticate(vkp, {
      derivationPath: JolocomLib.KeyTypes.jolocomIdentityKey,
      encryptionPass: pword
    });

    kcToken = await idw.create.interactionTokens.request.share(credReqAttrs, pword)
    kcBody = {request: kcToken.encode(),
              attrs: {
                name: "Scooter",
                email: "scooter-email"
              }}

      authReqBody = {request: await idw.create.interactionTokens.request.auth(basicAttrs, pword).then(t => t.encode()),
                     attrs: basicAttrs
                  }
    fastify_instance.listen(3000, "0.0.0.0").then(console.log).catch(console.error)
  });

    afterAll(async () => {
        fastify_instance.close()
    })

  it('completes the authentication flow', async (done) => {
      const {body: validResp} = await doAuthFlow(idw)(basicAttrs)

      expect(validResp.validity).toEqual(true)
      done()
  })

  it('handles concurrent requests eleganty', async (done) => {
      const {body: {token: authReq}} = await tester.post('/request/authentication')
          .send(basicAttrs)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(201)

      const authReqP = JolocomLib.parse.interactionToken.fromJWT<Authentication>(authReq)

      const authResp = await idw.create.interactionTokens.response.auth(basicAttrs, pword, authReqP)

      const val = validity({token: authResp.encode()})

      const otherReq = keycloak(kcBody)

      const kcr = await otherReq
      await val

      const kcrP = JolocomLib.parse.interactionToken.fromJWT<CredentialResponse>(kcr.body.token)
      expect(idw.validateJWT(kcrP, kcToken))
      expect(kcrP.interactionToken.satisfiesRequest(kcToken.interactionToken))

      done()
  })

    it('handles load', async (done) => {
        const reqs = []

        for (let i = 0; i < 100; i++) {
            reqs.push(doAllFlows(idw)(basicAttrs, authReqBody, kcBody))
        }

        await Promise.all(reqs)

        done()
    })
})
