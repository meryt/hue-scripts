#!/usr/bin/env node

var config = require('./config.js');

var client = config.huejay;

var verbose = false;
if (process.argv.indexOf('-v') > -1 || process.argv.indexOf('--verbose') > -1) {
	verbose = true;
}

var index = -1;
var foundMatch = false;
process.argv.forEach((val, idx) => {
  var parsedInt = parseInt(val);
  if (!isNaN(parsedInt)) {
    index = parsedInt;
  }
});

function defined(light, prop) {
	return (typeof(light[prop]) !== 'undefined');
}

client.sensors.getAll()
  .then(sensors => {
    for (let sensor of sensors) {
      if (index < 0 || (index == sensor.id && !verbose)) {
        foundMatch = true;
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
        if (defined(sensor.config), 'reachable') {
          console.log(`    Reachable:      ${sensor.config.reachable}`);
        }
        console.log(`  State:`);
        console.log(`    Last Updated:   ${sensor.state.lastUpdated}`);
        if (defined(sensor.state, 'status')) {
          console.log(`    Status:         ${sensor.state.status}`);
        }
        if (defined(sensor.state, 'temperature')) {
          console.log(`    Temperature:    ${sensor.state.temperature}`); 
        }
        console.log();
      }

      if (index >= 0 && index == sensor.id && verbose) {
        foundMatch = true;
        console.log(sensor.state);
      }

    }

      if (!foundMatch) {
        console.log(`No sensor with id ${index} exists`);
      }
  })
  .catch(error => {
    console.log(error.stack);
  });