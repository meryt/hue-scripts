#!/usr/bin/env node

var config = require('./config.js');

var client = config.huejay;

var verbose = false;
if (process.argv.indexOf('-v') > -1 || process.argv.indexOf('--verbose') > -1) {
	verbose = true;
}

function defined(light, prop) {
	return (typeof(light[prop]) !== 'undefined');
}

client.sensors.getAll()
  .then(sensors => {
    for (let sensor of sensors) {
      console.log(`Sensor [${sensor.id}]: ${sensor.name}`);
      console.log(`  Type:             ${sensor.type}`);
      verbose && console.log(`  Manufacturer:     ${sensor.manufacturer}`);
      console.log(`  Model Id:         ${sensor.modelId}`);
      verbose && console.log('  Model:');
      verbose && console.log(`    Id:             ${sensor.model.id}`);
      verbose && console.log(`    Manufacturer:   ${sensor.model.manufacturer}`);
      verbose && console.log(`    Name:           ${sensor.model.name}`);
      verbose && console.log(`    Type:           ${sensor.model.type}`);
      verbose && console.log(`  Software Version: ${sensor.softwareVersion}`);
      console.log(`  Unique Id:        ${sensor.uniqueId}`);
      console.log(`  Config:`);
      console.log(`    On:             ${sensor.config.on}`);
      console.log(`  State:`);
      console.log(`    Last Updated:   ${sensor.state.lastUpdated}`);
      console.log();
    }
  })
  .catch(error => {
    console.log(error.stack);
  });