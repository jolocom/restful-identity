import * as fastify from 'fastify';
import * as request from 'supertest';
import {JolocomLib} from 'jolocom-lib';
import app from '../../src/app';
import { IdentityWallet } from 'jolocom-lib/js/identityWallet/identityWallet';
import { Server, IncomingMessage, ServerResponse } from "http";

const seed = new Buffer('b'.repeat(64), 'hex');
const pword = 'henlmao';
const vkp = new JolocomLib.KeyProvider(seed, pword);

const reg = JolocomLib.registries.jolocom.create();

const authattr = {callbackURL: 'http://localhost:3000'};

const server: fastify.FastifyInstance<
  Server,
  IncomingMessage,
  ServerResponse
> = fastify({logger:true});

server.register(app, {idArgs: {seed: new Buffer('a'.repeat(64), 'hex'),
                               password: pword},
                      loki: {file: 'db.json',
                             collections: ['interactions']},
                      service: authattr});

let idw: IdentityWallet;

describe('identity interaction integration test', () => {
  beforeAll(async () => {
    jest.setTimeout(100000);

    await server.ready();

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
    const result = await request(server).get('/authenticationRequest');
    const resultParsed = JolocomLib.parse.interactionToken.fromJWT(result.body)

    const response = await idw.create.interactionTokens.response.auth(authattr, pword, resultParsed);
    const responseJWT = response.encode();

    await request(server).post('/validateResponse').send(responseJWT).expect(202);
  })
})
