'use strict';

const oddcast = require('oddcast');
const redis = require('redis');
const oddworks = require('@oddnetworks/oddworks');

// Require the stores and/or services you want to use
const redisStore = oddworks.stores.redis;
const redisSearchStore = oddworks.stores.redisSearch;
const identityService = oddworks.services.identity;
const catalogService = oddworks.services.catalog;
const jsonAPIService = oddworks.services.jsonApi;
const eventsService = oddworks.services.events;

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const REDIS_URL = process.env.REDISTOGO_URL || process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const GOOGLE_ANALYTICS_ID = process.env.GOOGLE_ANALYTICS_ID || 'UA-XXXX-XX';

const redisClient = redis.createClient(REDIS_URL);

/* eslint-disable */
const googleAnalyticsAnalyzer = eventsService.analyzers.googleAnalytics({trackingId: GOOGLE_ANALYTICS_ID});
/* eslint-enable */

module.exports = {
	env: ENVIRONMENT,
	port: PORT,
	oddcast: {
		// override the default oddcast options/transports here
		events: {
			options: {},
			transport: oddcast.inprocessTransport()
		},
		commands: {
			options: {},
			transport: oddcast.inprocessTransport()
		},
		requests: {
			options: {},
			transport: oddcast.inprocessTransport()
		}
	},

	stores: [
		{
			store: redisStore,
			options: {redis: redisClient, types: ['platform', 'channel', 'collection', 'promotion', 'video', 'view']}
		},
		{
			store: redisSearchStore,
			options: {redis: redisClient, types: ['collection', 'video']}
		}
	],

	services: [
		{
			service: identityService,
			options: {jwtSecret: JWT_SECRET}
		},
		{
			service: catalogService,
			options: {}
		},
		{
			service: jsonAPIService,
			options: {}
		},
		{
			service: eventsService,
			options: {
				redis,
				analyzers: [
					googleAnalyticsAnalyzer
				]
			}
		}
	],

	middleware: function (app) {
		// Decode the JWT set on the X-Access-Token header and attach to req.identity
		app.use(identityService.middleware.verifyAccess({header: 'x-access-token'}));

		// Decode the JWT set on the Authorization header and attach to req.authorization
		// app.use(authorizationService.middleware({header: 'Authorization'}));

		// Attach auth endpoints
		// POST /auth/platform/code
		// POST /auth/user/authorize
		// POST /auth/platform/token
		// GET /auth/user/:clientUserID/platforms
		// DELETE /auth/user/:clientUserID/platforms/:platformUserProfileID
		// app.use('/auth', authorizationService.router());

		// Attach events endpoint
		// POST /events
		// app.use('/events', eventsService.router());

		// Attach config endpoint
		// GET /config
		app.use('/', identityService.router());

		// Attach catalog endpoints with specific middleware, the authorization service is passed in as middleware to protect/decorate the entities as well
		// GET /videos
		// GET /videos/:id
		// GET /collections
		// GET /collections/:id
		// GET /views
		// GET /views/:id
		app.use(catalogService.router({middleware: []}));

		app.use(eventsService.router());

		// Serialize all data into the JSON API Spec
		app.use(jsonAPIService.middleware.formatter());
		app.use(jsonAPIService.middleware.deformatter());
	}
};
