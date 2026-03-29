const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

require('dotenv').config((process.argv[2] && !process.argv[2].toString().includes('/')) ? { path: path.join(__dirname, `../../.${process.argv[2]}.env`)} : { path: path.join(__dirname, `../../.env`)});
 
const envVarsSchema = Joi.object()
.keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),
    HTTPS: Joi.boolean().default(false),
    BASE_URL: Joi.string().required().description('API base URL'),
    JWT_EXPIRATION_TIME: Joi.string().required().description('JWT expiration time'),
    EPOCH: Joi.string().required().description('Epoch time'),
    SALT_ROUNDS: Joi.number().required().description('Salt rounds'),
    JWT_SECRET: Joi.string().required().description('JWT secret'),
    MONGODB_URI: Joi.string().required().description('Mongo DB url'),
    BUCKETS: Joi.string().required().description('Buckets'),
    LOCATIONS_API_URL: Joi.string().required().description('Locations API URL'),
    LOCATIONS_API_USER: Joi.string().required().description('Locations API user'),
})
.unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
	throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
    nodeEnv: envVars.NODE_ENV,
	port: envVars.PORT,
    https: envVars.HTTPS,
    baseUrl: envVars.BASE_URL,
    auth: {
        jwtExpirationTime: envVars.JWT_EXPIRATION_TIME,
        epoch: envVars.EPOCH,
        saltRounds: envVars.SALT_ROUNDS,
        jwtSecret: envVars.JWT_SECRET,
    },
    database: {
		uri: envVars.MONGODB_URI,
        buckets: envVars.BUCKETS.split(','),
	},
    email: {
        host: envVars.EMAIL_HOST,
        user: envVars.EMAIL_USER,
        pass: envVars.EMAIL_PASS,
        port: envVars.EMAIL_PORT,
        sender: envVars.EMAIL_SENDER,
        admin: envVars.EMAIL_ADMIN,
    },
    locations: {
        url: envVars.LOCATIONS_API_URL,
        user: envVars.LOCATIONS_API_USER,
    }
}