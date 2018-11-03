var config = require('./config.js');

var client = config.huejay;

if (process.argv.length != 5) {
    console.error("Usage: node set-rule-next-sensor-state.js <rule_id> <sensor_id> <next_state>");
    process.exit(1);
}

var ruleId = process.argv[2];
var sensor = process.argv[3];
var state = process.argv[4];

console.log(`Setting rule ${ruleId}'s sensor ${sensor} status to ${state}`);


if (ruleId < 0) {
    console.error("No valid rule ID specified");
} else {
    client.rules.getById(ruleId)
        .then(rule => {

            for (let action of rule.actions) {
                if (isCounterAction(action)) {
                    console.log(JSON.stringify(action));
                    if (action.address == `/sensors/${sensor}/state`) {
                        action.body.status = state;
                        client.rules.save(rule);
                    }
                }
            }

        })
        .catch(error => {
            console.log('Rule does not exist');
            console.log(error.stack);
        });
}

function isCounterAction(action) {
    return /\/sensors\/\d+\/state/.exec(action.address);
}
