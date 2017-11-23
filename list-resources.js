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

client.resourceLinks.getAll()
  .then(resourceLinks => {
    for (let resourceLink of resourceLinks) {
      console.log(`Resource Link [${resourceLink.id}]:`, resourceLink.name);
      console.log(`  Description: ${resourceLink.description}`);
      console.log(`  Type: ${resourceLink.type}`);
      console.log(`  Class Id: ${resourceLink.classId}`);
      console.log(`  Owner: ${resourceLink.owner}`);
      console.log(`  Recycle: ${resourceLink.recycle}`);
      console.log(`  Links: ${resourceLink.links}`);
      console.log();
    }
  })
  .catch(error => {
    console.log(error.stack);
  });

  