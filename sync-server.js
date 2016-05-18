'use strict';

const redis = require('redis');
const Promise = require('bluebird');
const winston = require('winston');
const oddworks = require('@oddnetworks/oddworks');

const StoresUtils = oddworks.storesUtils;
const ServicesUtils = oddworks.servicesUtils;

const oddcast = require('oddcast');
const bus = oddcast.bus();

const ENVIRONMENT = process.env.NODE_ENV || 'development';
const LOG_LEVEL = ENVIRONMENT === 'production' ? 'info' : 'debug';
const FIVE_MINUTES = 5 * 60 * 1000;
const UTC_OFFSET = 0;
const SYNC_INTERVAL = process.env.SYNC_INTERVAL || FIVE_MINUTES;

const VIMEO_API_TOKEN = process.env.VIMEO_API_TOKEN;
const REDIS_URL = process.env.REDISTOGO_URL || process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const redisClient = redis.createClient(REDIS_URL);
const seedData = require('./data/seed');

// Initialize oddcast for events, commands, requests
bus.events.use({}, oddcast.inprocessTransport());
bus.commands.use({}, oddcast.inprocessTransport());
bus.requests.use({}, oddcast.inprocessTransport());

function setupLogger() {
	oddworks.logger.configure({
		transports: [
			new winston.transports.Console({
				level: LOG_LEVEL,
				colorize: true,
				timestamp() {
					return new Date().format('YYYY-MM-DDThh:mm:ss.SSSZ', UTC_OFFSET);
				},
				handleExceptions: true
			})
		]
	});
	return Promise.resolve(true);
}

// Setup logger
module.exports = setupLogger()
	.then(() => {
		// Initialize stores
		StoresUtils.load(bus,
			[
				{
					store: oddworks.stores.redis,
					options: {redis: redisClient, types: ['channel', 'platform', 'collection', 'promotion', 'video', 'view']}
				},
				{
					store: oddworks.stores.redisSearch,
					options: {redis: redisClient, types: ['collection', 'video']}
				}
			])
	})
	// Seed the stores with channel and platform data
	.then(() => {
		return seedData(bus);
	})
	.then(() => {
		// Initialize services
		return ServicesUtils.load(bus, [
			{
				service: oddworks.services.catalog,
				options: {}
			},
			{
				service: oddworks.services.sync,
				options: {
					interval: SYNC_INTERVAL,
					providers: [
						oddworks.services.sync.providers.vimeo({token: VIMEO_API_TOKEN})
					]
				}
			}
		]);
	})
	.catch(err => oddworks.logger.error(err.stack));
