'use strict';

const Promise = require('bluebird');
const winston = require('winston');
const oddworks = require('@oddnetworks/oddworks');

module.exports.setupLogger = (environment) => {
	const UTC_OFFSET = 0;
	const LOG_LEVEL = environment === 'production' ? 'info' : 'debug';
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
