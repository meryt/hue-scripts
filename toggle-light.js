#!/usr/bin/env node

// Toggle a light's on/off state based on its current state.
// usage: toggle-light.js <id>


var config = require('./config.js');

var client = config.huejay;

if (process.argv.length == 3) {
    lightId = parseInt(process.argv[2])
} else {
    console.log('usage: toggle-light.js <id>')
    return 1
}


client.lights.getById(lightId)
    .then(light => {
        light.on = !light.state.attributes.on
        return client.lights.save(light)
    })
    .then(light => {
        console.log(`Updated light to ${light.state.attributes.on ? 'on' : 'off'}`)
    })
    .catch(error => {
        console.log(error.stack);
    });

