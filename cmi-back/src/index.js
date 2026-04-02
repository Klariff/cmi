const fs = require('fs');
const cors = require('cors');
const http = require('http');
const https = require('https');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const app = express();
const env = require('./config/env');
const { logging, log } = require('./services/log.service');

app.use(cors());

app.use('/*', (req, res, next) => { (mongoose.connection.readyState === 1) ? next() : res.status(logging.databaseNotReady.code).json(logging.databaseNotReady) });

mongoose.connect(env.database.uri, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    log(null, logging.databaseConnected);
}).catch(error => {
    log(null, logging.internalServerError, error.message);
});

mongoose.connection.once('open', async () => {
    global.gfs = {};
    env.database.buckets.forEach(bucket => {
        global.gfs[bucket] = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: bucket
        });
    });

    await require('./services/geo-seed.service')();
    await require('./services/geo-migration.service')();
});

if (env.https) {
    var privateKey = fs.readFileSync(`/etc/letsencrypt/live/${env.baseUrl}/privkey.pem`)
    var certificate = fs.readFileSync(`/etc/letsencrypt/live/${env.baseUrl}/cert.pem`)
    var credentials = { key: privateKey, cert: certificate };
    https.createServer(credentials, app).listen(env.port, () => { console.log('HTTPS SERVER LISTENING @ ' + env.port) });
} else {
    http.createServer(app).listen(env.port, () => { console.log('HTTP SERVER LISTENING @ ' + env.port) });
}

app.use(bodyParser.json())

app.use('/api', require('./routes/index.js'));

fs.readdirSync(__dirname + '/models').forEach(function (file) { if (~file.indexOf('.js')) require(__dirname + '/models/' + file); });

app.use(methodOverride('_method'));

app.set('view engine', 'ejs');

app.post('/api/echo', (req, res) => {
    res.json(req.body);
});

module.exports = app;
