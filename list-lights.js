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

client.lights.getAll()
  .then(lights => {
    for (let light of lights) {
      console.log(`Light [${light.id}]: ${light.name}`);
      console.log(`  Type:             ${light.type}`);
      verbose                     && console.log(`  Unique ID:        ${light.uniqueId}`);
      verbose                     && console.log(`  Manufacturer:     ${light.manufacturer}`);
      verbose                     && console.log(`  Model Id:         ${light.modelId}`);
      verbose                     && console.log('  Model:');
      verbose                     && console.log(`    Id:             ${light.model.id}`);
      verbose                     && console.log(`    Manufacturer:   ${light.model.manufacturer}`);
      verbose                     && console.log(`    Name:           ${light.model.name}`);
      verbose                     && console.log(`    Type:           ${light.model.type}`);
      verbose && light.model.colorGamut && console.log(`    Color Gamut:    ${light.model.colorGamut}`);
      verbose                     && console.log(`    Friends of Hue: ${light.model.friendsOfHue}`);
      verbose                     && console.log(`  Software Version: ${light.softwareVersion}`);
      verbose && console.log('  State:');
      console.log(`    On:         ${light.on}`);
      console.log(`    Reachable:  ${light.reachable}`);
      console.log(`    Brightness: ${light.brightness}`);
      verbose                      && console.log(`    Color mode: ${light.colorMode}`);
      defined(light, 'hue')        && console.log(`    Hue:        ${light.hue}`);
      defined(light, 'saturation') && console.log(`    Saturation: ${light.saturation}`);
      defined(light, 'xy')         && console.log(`    X/Y:        ${light.xy[0]}, ${light.xy[1]}`);
      defined(light, 'colorTemp')  && console.log(`    Color Temp: ${light.colorTemp}`);
      light.alert !== 'none'       && console.log(`    Alert:      ${light.alert}`);
      defined(light, 'effect') && light.effect !== 'none' && console.log(`    Effect:     ${light.effect}`);
      console.log();
    }
  });
