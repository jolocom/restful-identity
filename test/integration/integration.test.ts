import * as fastify from 'fastify';
import {JolocomLib} from 'jolocom-lib';
import identityService from '../../src/services/identityService';
import * as supertest from 'supertest'
import { IdentityWallet } from 'jolocom-lib/js/identityWallet/identityWallet';
import { Server, IncomingMessage, ServerResponse } from "http";
import { Authentication } from 'jolocom-lib/js/interactionTokens/authentication';
import identity from '../../src/plugins/identity';

const seed = new Buffer('b'.repeat(64), 'hex');
const pword = 'henlmao';
const vkp = JolocomLib.KeyProvider.fromSeed(seed, pword);

const reg = JolocomLib.registries.jolocom.create();

const url = 'http://localhost:3000';

const tester = supertest(url)

const fastify_instance: fastify.FastifyInstance<
  Server,
  IncomingMessage,
  ServerResponse
> = fastify({logger:true});

fastify_instance.register(identityService);

const basicAttrs = {callbackURL: 'https://google.com',
                    description: 'test description'}

let idw: IdentityWallet;

const load = (testr: supertest.SuperTest<supertest.Test>) => endpoint => async (body) =>
    testr.post(endpoint)
    .send(body)
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(201)

const authReq = load(tester)('/request/authentication')
const authResp = load(tester)('/response/authentication')
const validity = load(tester)('/validate')

const doAuthFlow = (ident: IdentityWallet) => async (attrs) => {
    const {body: {token: val}} = await authReq(attrs)
    const token = JolocomLib.parse.interactionToken.fromJWT<Authentication>(val)
    const response = await ident.create.interactionTokens.response.auth(attrs, pword, token)
    return await validity({token: response.encode()}) }

describe('identity interaction integration test', () => {
  beforeAll(async () => {
    jest.setTimeout(100000);

    await fastify_instance.ready();

    //await JolocomLib.util.fuelKeyWithEther(vkp.getPublicKey({
    //  derivationPath: JolocomLib.KeyTypes.ethereumKey,
    //  encryptionPass: pword
    //}));

    idw = await reg.authenticate(vkp, {
      derivationPath: JolocomLib.KeyTypes.jolocomIdentityKey,
      encryptionPass: pword
    });


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
      expect(authReq)

      const authResp = await idw.create.interactionTokens.response.auth(basicAttrs, pword, authReqP)

      const val = tester.post('/validate')
          .send({token: authResp.encode()})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(201)
          .then(val => expect(val.body.validity).toEqual(true))

      const otherReq = tester.post('/response/authentication')
          .send({request: authReq,
                 attrs: basicAttrs})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(201)

      await otherReq
      await val

      done()
  })

    it('handles load', async (done) => {
        const reqs = []

        for (let i = 0; i < 100; i++) {
            reqs.push(doAuthFlow(idw)(basicAttrs))
        }

        await Promise.all(reqs)

        done()
    })
})
