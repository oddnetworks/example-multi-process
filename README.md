# Oddworks Example Server - Multi Process

This is a quick example of an Oddworks server with the API running in one process, and a sync service running in a separate process.

This is only an example and should not be used in production. You would likely want to do things differently.

This setup uses the following oddworks stores and services:

- __[redis store](https://github.com/oddnetworks/oddworks/tree/master/lib/stores/redis)__
- __[redis-search store](https://github.com/oddnetworks/oddworks/tree/master/lib/stores/redis-search)__
- __[catalog service](https://github.com/oddnetworks/oddworks/blob/master/lib/services/catalog)__
- __[events service](https://github.com/oddnetworks/oddworks/blob/master/lib/services/events)__ - with the __[google-analytics analyzer](https://github.com/oddnetworks/oddworks/tree/master/lib/services/events/analyzers)__
- __[identity service](https://github.com/oddnetworks/oddworks/tree/master/lib/services/identity)__
- __[json-api service](https://github.com/oddnetworks/oddworks/tree/master/lib/services/json-api)__
- __[sync service](https://github.com/oddnetworks/oddworks/tree/master/lib/services/sync)__ - with the __vimeo provider__

## Deploy It!

You can install this to Heroku as-is to get a quick reference API.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

If you have this code locally, you can add your Heroku app as a git remote like so:

		$ git remote add heroku https://git.heroku.com/your-heroku-application-name.git

Then you can push changes like so:

		$ git push heroku master

_*Note_: Auto-deploying on Heroku will automatically generate a new JWT_SECRET environment variable for you. You will need this for generating the JWT (json web token) used in the `x-access-token` header for API requests, or within the various platform SDKs.

## Local Setup

After you've cloned this repo locally, follow these steps to get it running.

### Install node modules

		$ npm install

We use [foreman](https://www.npmjs.com/package/foreman) to manage multiple node processes via the `./Procfile`.

		$ npm install -g foreman

### Environment Variables

You will need the following environment variables before running this example

- `REDIS_URL` - this environment variable will point to a redis instance and will be used with the __redis store__ and the __redis-search store__. The default value is `redis://127.0.0.1:6379` (a local redis instance).
- `VIMEO_API_TOKEN` - this environment variable will be used to gather the videos associated with the token's Vimeo user account. See [sync providers](https://github.com/oddnetworks/oddworks/tree/master/lib/services/sync/providers) for more details.
- `GOOGLE_ANALYTICS_ID` - this environment variable is used to send event metrics into the __google-analytics event analyzer__. An example value is `UA-XXXX-XX`
- `SYNC_INTERVAL` - this environment variable sets the interval (in milliseconds) at which the sync providers will run. The default value is `300000` (five minutes).
- `JWT_SECRET` - this environment variable is used as the secret used to sign your [JWT tokens](https://jwt.io/). The default value is `secret`.

You can set these manually, or you can use __foreman__. [foreman](https://www.npmjs.com/package/foreman) recognizes an `.env` file. You can set one locally for development purposes, but should not check it in to git.

An example `.env` file:
```
NODE_ENV=development
REDIS_URL=redis://127.0.0.1:6379
VIMEO_API_TOKEN=your-vimeo-api-token
GOOGLE_ANALYTICS_ID=UA-XXXX_XX
SYNC_INTERVAL=300000
JWT_SECRET=your-secret-token
```
_*Note_: You will need real values for `REDIS_URL` and `VIMEO_API_TOKEN`.

### Start

Locally you can use the following command to start the server:

Using foreman:

		$ nf start

## Hit the API

Once your server is running, you can begin making requests like so:

		$ curl -X GET -H "x-access-token: YOUR_TOKEN_HERE" -H "Accept: application/json" "http://localhost:3000/videos"

__Required Headers__

- `x-access-token` - the value here will depend on how you deployed and your environment. See [Access Tokens](#access-tokens)
- `accept` - the value here should always be `application/json`

### Access Tokens

The default data includes one channel with an id of `odd-networks` and three platforms with ids of `android`, `apple-tv`, and `roku`. In order to generate an access token for the sample data, you can use the [oddworks-cli](https://www.npmjs.com/package/@oddnetworks/oddworks-cli) like so:

		$ oddworks generate-token -c odd-networks -p android -j {your-jwt-secret}

If you did not explicitly set the `JWT_SECRET` environment varaible, it will default to the value `secret`. If you deployed using the Heroku auto-deploy, this environment variable was auto-generated for you and can be found by running the following:

		$ heroku config -a your-heroku-app-name | grep JWT_SECRET

## Example Data

By default we use the `odd-networks` seed function provided by `./data/seed.js`

We are only using the seed script to load 1 `channel` and 3 `platform` entities. The rest of our data is coming from Vimeo (via our sync service and provider) and will only contain `video` data if you have videos you have uploaded to the associated Vimeo account.

You do not need to override example data, but if you want to, please see `./data/seed.js`
