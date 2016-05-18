'use strict';

const path = require('path');

const jwt = require('jsonwebtoken');
const Promise = require('bluebird');
const glob = Promise.promisifyAll(require('glob')).GlobAsync;
const searchableTypes = ['collection', 'video'];
const logger = require('@oddnetworks/oddworks').logger;

const jwtSecret = process.env.JWT_SECRET || 'secret';

function loadFiles(files) {
	const objects = [];
	for (let file of files) {
		objects.push(require(path.join(__dirname, file))); // eslint-disable-line
	}
	return objects;
}

function seedData(bus, objects) {
	const promises = [];

	for (let object of objects) {
		const searchable = Boolean(searchableTypes.indexOf(object.type) + 1);
		let pattern = {role: 'store', cmd: 'set', type: object.type};
		if (searchable) {
			pattern = {role: 'catalog', cmd: 'create', searchable: true};
		}

		const payload = {
			version: 1,
			channel: object.channel,
			platform: object.id,
			scope: ['platform']
		};

		const token = jwt.sign(payload, jwtSecret);
		if (object.type === 'platform') {
			logger.debug(`${object.type}: ${object.id}`);
			logger.debug(`     JWT: ${token}`);
		} else {
			logger.debug(`${object.type}: ${object.id}`);
		}

		promises.push(bus.sendCommand(pattern, object));
	}

	return promises;
}

module.exports = bus => {
	return glob('./+(channel|platform)/*.json', {cwd: __dirname})
		.then(loadFiles)
		.then(objects => {
			logger.debug(`Loading test Channel and Platforms...`);
			logger.debug(`-------------------------------------`);
			return Promise.all(seedData(bus, objects));
		});
};
