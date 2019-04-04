
import * as fp from 'fastify-plugin';

// utility plugins
import identity from './plugins/identity';
import interactions from './plugins/interactions';

// route/app plugin
import identityService from './services/identityService';

export default fp(async (instance: any, opts, next) => {
  instance.register( identity, {idArgs: {seed: new Buffer('a'.repeat(64), 'hex'),
                                       password: 'secret'}});
  instance.register( interactions, {loki: {file: 'interactions.json',
                                         collections: ['interactions']}});
  instance.register( identityService, {service: {callbackURL: 'http://localhost:3000'}})

})
