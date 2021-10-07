#!/usr/bin/env node

var config = require('./config.js');
var colors = require('colors');

var client = config.huejay;

var verbose = false;
if (process.argv.indexOf('-v') > -1 || process.argv.indexOf('--verbose') > -1) {
    verbose = true;
}

var veryVerbose = false;
if (process.argv.indexOf('-vv') > -1 || process.argv.indexOf('--very-verbose') > -1) {
    verbose = true;
    veryVerbose = true;
}


function defined(light, prop) {
    return (typeof(light[prop]) !== 'undefined');
}

var index = -1;
var foundMatch = false;
process.argv.forEach((val, idx) => {
    var parsedInt = parseInt(val);
    if (!isNaN(parsedInt)) {
        index = parsedInt;
    }
});

if (index == 0) {
    console.log("/groups/0 is the special group that contains all the lights.");
} else {
    loadAndPrintGroups();
}

function loadAndPrintGroups() {
    client.groups.getAll()
        .then(groups => {
            for (let group of groups) {
                if (index < 0 || index == group.id) {
                    foundMatch = true;
                    console.log(`Group [`.white + `${group.id}`.green + `]: `.white + `${group.name}`.yellow);
                    if (verbose) {
                        console.log(`  Type: ${group.type}`);
                        console.log(`  Class: ${group.class}`);
                    }
                    console.log('  Light Ids: ' + group.lightIds.join(', ').cyan);
                    if (verbose) {
                        console.log('  State:');
                        console.log(`    Any on:     ${group.anyOn}`);
                        console.log(`    All on:     ${group.allOn}`);
                    }
                    if (veryVerbose) {
                        console.log('  Action:');
                        console.log(`    On:         ${group.on}`);
                        console.log(`    Brightness: ${group.brightness}`);
                        console.log(`    Color mode: ${group.colorMode}`);
                        console.log(`    Hue:        ${group.hue}`);
                        console.log(`    Saturation: ${group.saturation}`);
                        if (defined(group, 'xy')) {
                            console.log(`    X/Y:        ${group.xy[0]}, ${group.xy[1]}`);
                        }
                        console.log(`    Color Temp: ${group.colorTemp}`);
                        console.log(`    Alert:      ${group.alert}`);
                        console.log(`    Effect:     ${group.effect}`);

                        if (group.modelId !== undefined) {
                            console.log(`  Model Id: ${group.modelId}`);
                            console.log(`  Unique Id: ${group.uniqueId}`);
                            console.log('  Model:');
                            console.log(`    Id:           ${group.model.id}`);
                            console.log(`    Manufacturer: ${group.model.manufacturer}`);
                            console.log(`    Name:         ${group.model.name}`);
                            console.log(`    Type:         ${group.model.type}`);
                        }
                    }

                    console.log();
                }
            }

            if (index >= 0 && !foundMatch) {
                console.log("no group found with id " + index);
            }
        });
}
