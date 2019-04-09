import * as fastify from 'fastify';
import {JolocomLib} from 'jolocom-lib';
import app from '../../src/app';
import identityService from '../../src/services/identityService';
import { IdentityWallet } from 'jolocom-lib/js/identityWallet/identityWallet';
import { Server, IncomingMessage, ServerResponse } from "http";

const seed = new Buffer('b'.repeat(64), 'hex');
const pword = 'henlmao';
const vkp = new JolocomLib.KeyProvider(seed, pword);

const reg = JolocomLib.registries.jolocom.create();

const authCallback = 'http://localhost:3000';

const fastify_instance: fastify.FastifyInstance<
  Server,
  IncomingMessage,
  ServerResponse
> = fastify({logger:true});

fastify_instance.register(identityService, {callbackURL: authCallback, idArgs: {seed: new Buffer('a'.repeat(64), 'hex'), password: pword}});

let idw: IdentityWallet;

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
  });

  it('completes the authentication flow', async () => {
    const result = await fastify_instance.inject({method: 'GET', url: '/authenticationRequest'});
    expect(result.payload).not.toBe(500);

    const resultParsed = JolocomLib.parse.interactionToken.fromJWT(result.payload);

    const response = await idw.create.interactionTokens.response.auth({callbackURL: authCallback}, pword, resultParsed);
    const responseJWT = response.encode();

    await fastify_instance.inject({method: 'POST', url: '/validateResponse', payload: {token: responseJWT}})
      .then(resp => expect(resp.statusCode).toBe(204));
  })
})
