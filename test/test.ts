import * as fastify from 'fastify';
import {JolocomLib} from 'jolocom-lib';
import app from '../app';

const seed = new Buffer('a'.repeat(64), 'hex');
const pword = 'henlmao';

const vkp = new JolocomLib.KeyProvider(seed, pword);
const reg = JolocomLib.registries.jolocom.create();

const authattr = {callbackURL: 'http://localhost:3000'};

const server = fastify();
server.register(app, {idArgs: {seed: new Buffer('a'.repeat(64), 'hex'),
                               password: pword},
                      loki: {file: 'db.json',
                             collections: ['interactions']},
                      service: authattr});

server.listen(3000, '0.0.0.0').then(async (addr) => {
  await JolocomLib.util.fuelKeyWithEther(vkp.getPublicKey({
    derivationPath: JolocomLib.KeyTypes.ethereumKey,
    encryptionPass: pword
  }));
  console.log('key fueled');

  const idw = await reg.authenticate(vkp, {
    derivationPath: JolocomLib.KeyTypes.jolocomIdentityKey,
    encryptionPass: pword
  });
  console.log('id valid');


  const req = await fetch(authattr.callbackURL + '/authenticationRequest');
  console.log(req.body);

  const reqJWT = req;
  console.log(reqJWT)

  const resp = await idw.create.interactionTokens.response.auth(authattr, pword, JolocomLib.parse.interactionToken.fromJWT(reqJWT));
  console.log(resp.toJSON());

})()
