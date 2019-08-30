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
import { IDParameters } from '../../src/plugins/types';
import { getInfrastructure } from '../../src/utils/infrastructure';
import { SoftwareKeyProvider } from 'jolocom-lib/js/vaultedKeyProvider/softwareProvider';


const params: IDParameters = {
    dep: {
        endpoint: '',
        contract: ''
    },
    idArgs: {
        seed: Buffer.from('b'.repeat(64), 'hex'),
        password: 'h'.repeat(32)
    }
}

const {vkp, reg, password, mRes} = getInfrastructure('henlmao' , params)

// const url = 'raspberrypi.local:3000';
const url = 'http://localhost:3000'

const tester = supertest(url)

const fastify_instance: fastify.FastifyInstance<
  Server,
  IncomingMessage,
  ServerResponse
> = fastify({logger:true});

fastify_instance.register(identityService, params);

const basicAttrs = {callbackURL: 'https://google.com',
                    description: 'test description'}

const credReqAttrs: CredentialShareRequestCreationArgs = {
    callbackURL: 'https://google.com',
    credentialRequirements: [
        {
            type: ['name'],
            constraints: []
        },
        {
            type: ['email'],
            constraints: []
        }
    ]
}

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

const doAuthFlow = (ident: IdentityWallet, pass: string) => async (authAttrs) => {
    const {body: {token: val}} = await authReq(authAttrs)
    const token = JolocomLib.parse.interactionToken.fromJWT<Authentication>(val)
    const response = await ident.create.interactionTokens.response.auth(authAttrs, pass, token)
    return validity({token: response.encode()}) }

const doAllFlows = (ident: IdentityWallet, pass: string) => async (authAttrs, authRespToken, kcToken) =>
    Promise.all([
        doAuthFlow(ident, pass)(authAttrs),
        keycloak(kcToken),
        authResp(authRespToken)
    ])

describe('identity interaction integration test', () => {
    let idw: IdentityWallet;
    let kcToken: JSONWebToken<CredentialRequest>;
    let kcBody;
    let authReqBody;
    const demopass = 'k'.repeat(32)


  beforeAll(async () => {
    jest.setTimeout(100000);

    await fastify_instance.ready();

    const demoseed = Buffer.from('c'.repeat(64), 'hex')

    const demovkp = SoftwareKeyProvider.fromSeed(demoseed, demopass)

      // idw = await reg.create(demovkp, demopass)
    idw = await reg.authenticate(demovkp, {
      derivationPath: JolocomLib.KeyTypes.jolocomIdentityKey,
      encryptionPass: demopass
    });

    kcToken = await idw.create.interactionTokens.request.share(credReqAttrs, demopass)
    kcBody = {request: kcToken.encode(),
              attrs: {
                name: "Scooter",
                email: "scooter-email"
              }}

      authReqBody = {request: await idw.create.interactionTokens.request.auth(basicAttrs, demopass).then(t => t.encode()),
                     attrs: basicAttrs
                  }
    fastify_instance.listen(3000, "0.0.0.0").then(console.log).catch(console.error)
  });

    afterAll(async () => {
        fastify_instance.close()
    })

  it('completes the authentication flow', async (done) => {
      const {body: validResp} = await doAuthFlow(idw, demopass)(basicAttrs)

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

      const authResp = await idw.create.interactionTokens.response.auth(basicAttrs, demopass, authReqP)

      const val = validity({token: authResp.encode()})

      const otherReq = keycloak(kcBody)

      const kcr = await otherReq
      await val

      const kcrP = JolocomLib.parse.interactionToken.fromJWT<CredentialResponse>(kcr.body.token)
      expect(idw.validateJWT(kcrP, kcToken, mRes))
      expect(kcrP.interactionToken.satisfiesRequest(kcToken.interactionToken))

      done()
  })

    it('handles load', async (done) => {
        const reqs = []

        for (let i = 0; i < 100; i++) {
            reqs.push(doAllFlows(idw, demopass)(basicAttrs, authReqBody, kcBody))
        }

        await Promise.all(reqs)

        done()
    })

    it('doesnt interfere with validation', async (done) => {
        const auths = []

        for (let i = 0; i < 100; i++) {
            auths.push(authReq(basicAttrs))
        }

        const authReqs = await Promise.all(auths).then(resps => resps.map(resp => resp.body.token))

        const authResps = await Promise.all(authReqs.map(async (req) => {
            const reqT = JolocomLib.parse.interactionToken.fromJWT<Authentication>(req)
            return await idw.create.interactionTokens.response.auth(basicAttrs,
                                                                    demopass,
                                                                    reqT).then(t => t.encode())}))

        const valReqs = authResps.map(resp => validity({token: resp}))

        const kcReqs = []

        for (let i = 0; i < 100; i++) {
            kcReqs.push(keycloak(kcBody))
        }

        await Promise.all([Promise.all(kcReqs), Promise.all(valReqs)])

        done()
    })
})
