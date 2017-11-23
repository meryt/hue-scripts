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

client.schedules.getAll()
  .then(schedules => {
    for (let schedule of schedules) {
      console.log(`Schedule [${schedule.id}]: ${schedule.name}`);
      console.log(`  Description: ${schedule.description}`);
      console.log(`  Created: ${schedule.created}`);
      console.log(`  Local time: ${schedule.localTime}`);
      console.log(`  Status: ${schedule.status}`);
      console.log(`  Auto delete: ${Boolean(schedule.autoDelete)}`);
      console.log(`  Action:`);
      console.log(`    Method: ${schedule.action.method}`);
      console.log(`    Address: ${schedule.action.address}`);
      console.log(`    Body: ${JSON.stringify(schedule.action.body)}`);
      console.log();
    }
  });
  