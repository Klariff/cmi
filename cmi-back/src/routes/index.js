const router = require('express').Router();
const fs = require('fs');
const path = require('path');

fs.readdirSync(__dirname).forEach((file)=>{ 
    if (file !== 'index.js') router.use('/', require(path.join(__dirname, file)));
});

module.exports = router;