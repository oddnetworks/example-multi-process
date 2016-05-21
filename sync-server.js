'use strict';

const redis = require('redis');
const oddcast = require('oddcast');
const oddworks = require('@oddnetworks/oddworks');
const firebase = require('firebase');
const utils = require('./utils');

const StoresUtils = oddworks.storesUtils;
const ServicesUtils = oddworks.servicesUtils;

const bus = oddcast.bus();

const ENVIRONMENT = process.env.NODE_ENV || 'development';
const FIVE_MINUTES = 5 * 60 * 1000;
const SYNC_INTERVAL = process.env.SYNC_INTERVAL || FIVE_MINUTES;
const GOOGLE_SERVICE_ACCOUNT = process.env.GOOGLE_SERVICE_ACCOUNT;
const VIMEO_API_TOKEN = process.env.VIMEO_API_TOKEN;

const seedData = require('./data/seed');

// Initialize oddcast for events, commands, requests
bus.events.use({}, oddcast.inprocessTransport());
bus.commands.use({}, oddcast.inprocessTransport());
bus.requests.use({}, oddcast.inprocessTransport());

firebase.initializeApp({
	databaseURL: 'https://oddworks-store.firebaseio.com',
	serviceAccount: GOOGLE_SERVICE_ACCOUNT
});

// Setup logger
module.exports = utils.setupLogger(ENVIRONMENT)
	.then(() => {
		// Initialize stores
		StoresUtils.load(bus,
			[
				{
					store: oddworks.stores.firebase,
					options: {firebase: firebase, types: ['channel', 'platform', 'collection', 'promotion', 'video', 'view']}
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
