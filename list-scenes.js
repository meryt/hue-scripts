#!/usr/bin/env node

var config = require('./config.js');

var client = config.huejay;

var verbose = false;
if (process.argv.indexOf('-v') > -1 || process.argv.indexOf('--verbose') > -1) {
    verbose = true;
}

client.scenes.getAll()
    .then(scenes => {
        for (let scene of scenes) {
            console.log(`Scene [${scene.id}]: ${scene.name}`);
            console.log('  Lights:', scene.lightIds.join(', '));
            console.log();
        }
    });
