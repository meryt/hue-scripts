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

if (index < 0) {
    console.error("No valid rule ID specified");
} else {
    client.rules.delete(index)
        .then(() => {
            console.log('Rule was deleted');
        })
        .catch(error => {
            console.log('Rule may have been removed already, or does not exist');
            console.log(error.stack);
        });
}
