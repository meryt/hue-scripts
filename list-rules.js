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

client.rules.getAll()
  .then(rules => {
    for (let rule of rules) {
        if (index < 0 || rule.id == index) {
            foundMatch = true;
            console.log(`Rule [${rule.id}]: ${rule.name}`);
            if (verbose) {
                console.log(`  Created:         ${rule.created}`);
                console.log(`  Last Triggered:  ${rule.lastTriggered}`);
                console.log(`  Times Triggered: ${rule.timesTriggered}`);
                console.log(`  Owner:           ${rule.owner}`);
                console.log(`  Status:          ${rule.status}`);

                console.log(`  Conditions:`);
                for (let condition of rule.conditions) {
                    console.log(`    Address:  ${condition.address}`);
                    console.log(`    Operator: ${condition.operator}`);
                    console.log(`    Value:    ${condition.value}`);
                    console.log();
                }

                console.log(`  Actions:`);
                for (let action of rule.actions) {
                    console.log(`    Address: ${action.address}`);
                    console.log(`    Method:  ${action.method}`);
                    console.log(`    Body:    ${JSON.stringify(action.body)}`);
                    console.log();
                }
                console.log();
            }
        }
    }

        if (index > -1 && !foundMatch) {
            console.log("No rule matched index " + index);
        }
  });
