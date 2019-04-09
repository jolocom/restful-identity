
import * as fp from 'fastify-plugin';

// utility plugins
import identity from './plugins/identity';
import interactions from './plugins/interactions';

// route/app plugin
import identityService from './services/identityService';

export default fp(async (instance: any, opts: {
  idArgs: {seed: any,
           password: string},
  service: {callbackURL: string}
}, next) => {

  instance.register(identity, opts.idArgs);
  instance.register(interactions, opts);
  instance.register(identityService, opts.service);

  next();
})
