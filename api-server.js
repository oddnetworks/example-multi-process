'use strict';

const _ = require('lodash');
const boom = require('boom');
const express = require('express');
const oddcast = require('oddcast');
const oddworks = require('@oddnetworks/oddworks');
const utils = require('./utils');

const StoresUtils = oddworks.storesUtils;
const ServicesUtils = oddworks.servicesUtils;
const middleware = oddworks.middleware;

const config = require('./api-config');

const ENVIRONMENT = process.env.NODE_ENV || 'development';

const bus = oddcast.bus();
const app = express();

// Initialize oddcast for events, commands, requests
bus.events.use(config.oddcast.events.options, config.oddcast.events.transport);
bus.commands.use(config.oddcast.commands.options, config.oddcast.commands.transport);
bus.requests.use(config.oddcast.requests.options, config.oddcast.requests.transport);

// Setup logger
module.exports = utils.setupLogger(ENVIRONMENT)
	.then(() => {
		// Initialize stores
		StoresUtils.load(bus, config.stores)
	})
	.then(() => {
		// Initialize services
		return ServicesUtils.load(bus, config.services);
	})
	.then(() => {
		// Start configuring express
		app.disable('x-powered-by');
		app.set('trust proxy', 'loopback, linklocal, uniquelocal');

		// Standard express middleware
		app.use(middleware());

		app.get('/', (req, res, next) => {
			res.body = {
				message: 'Server is running'
			};
			next();
		});

		config.middleware(app);

		app.use((req, res) => res.send(res.body));

		// 404
		app.use((req, res, next) => next(boom.notFound()));

		// 5xx
		app.use(function handleError(err, req, res, next) {
			if (err) {
				var statusCode = _.get(err, 'output.statusCode', (err.status || 500));
				if (!_.has(err, 'output.payload')) {
					err = boom.wrap(err, err.status);
				}

				res.status(statusCode || 500);
				res.body = err.output.payload;
				res.send(res.body);
			} else {
				next();
			}
		});

		if (!module.parent) {
			app.listen(config.port, () => {
				oddworks.logger.info(`Server is running on port: ${config.port}`);
			})
			.on('error', error => {
				oddworks.logger.error(`${error}`);
			});
		}

		return {bus, app};
	})
	.catch(err => oddworks.logger.error(err.stack));
