#!/usr/bin/env node

var config = require('./config.js');
var colors = require('colors');

var client = config.huejay;

var verbose = false;
if (process.argv.indexOf('-v') > -1 || process.argv.indexOf('--verbose') > -1) {
    verbose = true;
}

var allGroups = {};
var allScenes = {};
var allLights = {};

var index = -1;
var foundMatch = false;
process.argv.forEach((val, idx) => {
  var parsedInt = parseInt(val);
  if (!isNaN(parsedInt)) {
    index = parsedInt;
  }
});

client.sensors.getAll()
  .then(sensors => {
    for (let sensor of sensors) {
      if (sensor.type == 'ZLLSwitch' && (index == -1 || index == sensor.id)) {
        if (index > -1) {
          foundMatch = true;
        }
        printDimmer(sensor, foundMatch);
        if (foundMatch) {
          loadRules(index);
        }
      }
    }

    if (index > -1 && !foundMatch) {
      console.log("No dimmer found with index " + index);
    }

  })
  .catch(error => {
    console.log(error.stack);
  });


function printDimmer(sensor, showingSingleItem) {

  if (showingSingleItem) {
    console.log(`[${sensor.name}]`.yellow);
  } else {
    console.log(`Sensor [`.white + `${sensor.id}`.green + `]:`.white + ` ${sensor.name}`.yellow);
  }
  verbose && console.log(`  Type:             ${sensor.type}`);
  verbose && console.log(`  Manufacturer:     ${sensor.manufacturer}`);
  verbose && console.log(`  Model Id:         ${sensor.modelId}`);
  verbose && console.log('  Model:');
  verbose && console.log(`    Id:             ${sensor.model.id}`);
  verbose && console.log(`    Manufacturer:   ${sensor.model.manufacturer}`);
  verbose && console.log(`    Name:           ${sensor.model.name}`);
  verbose && console.log(`    Type:           ${sensor.model.type}`);
  verbose && console.log(`  Software Version: ${sensor.softwareVersion}`);
  verbose && console.log(`  Unique Id:        ${sensor.uniqueId}`);
  verbose && console.log(`  Config:`);
  verbose && console.log(`    On:             ${sensor.config.on}`);
  verbose && console.log(`  Last Updated:   ${sensor.state.lastUpdated}`);
  console.log();
}

function loadRules(sensor) {

  client.groups.getAll()
    .then(groups => {
        for (let group of groups){
          allGroups[group.id] = `[${group.id}] ${group.name}`;
        }

        client.scenes.getAll()
          .then(scenes => {

              for (let scene of scenes) {
                allScenes[scene.id] = {
                  'name': scene.name.replace(/-Switch$/, ''),
                  'lights' : scene.lightIds
                };
              }

              client.lights.getAll()
                .then(lights => {

                    for (let light of lights) {
                      allLights[light.id] = light.name;
                    }

                    client.rules.getAll()
                        .then(rules => {
                          var allRules = [];
                          for (let rule of rules) {
                            for (let condition of rule.conditions) {
                              if (condition.address == '/sensors/' + sensor + '/state/buttonevent') {
                                allRules.push(assembleRule(rule, sensor));
                              }
                            }
                          }

                          allRules.sort(compareRules);
                          for (let singleRule of allRules) {
                            printRule(singleRule);
                          }
                        });

                  });


            });

      });
}

function assembleRule(rule, sensor) {

  var item = {
    'rule': rule.id,
    'actions': [],
    'isRelease': false,
    'condition': ''
  };

  verbose && console.log(`Rule [${rule.id}]: ${rule.name}`);
  verbose && console.log(`  Created:         ${rule.created}`);
  verbose && console.log(`  Last Triggered:  ${rule.lastTriggered}`);
  verbose && console.log(`  Times Triggered: ${rule.timesTriggered}`);
  verbose && console.log(`  Owner:           ${rule.owner}`);
  verbose && console.log(`  Status:          ${rule.status}`);

  verbose && console.log(`  Conditions:`)
  for (let condition of rule.conditions) {
    if (isButtonAction(condition, sensor)) {
      if (/[0-9]000/.exec(condition.value)) {
        item.button =  condition.value.substr(0, 1);
        item.isLongPress = false;
      } else if (/[0-9]001/.exec(condition.value)) {
        item.button =  condition.value.substr(0, 1);
        item.isLongPress = true;
      } else if (/[0-9]002/.exec(condition.value)) {
        item.button =  condition.value.substr(0, 1);
        item.isRelease = true;
      } else if (/[0-9]003/.exec(condition.value)) {
        item.button =  condition.value.substr(0, 1);
        item.isRelease = true;
        item.isLongPress = true;
      } else {
        item.button = condition.value;
      }
    } else if (isCounterCondition(condition)) {
      item.conditionSensor = sensorNameFromCondition(condition);
      if (condition.operator == 'eq') {
        item.count = parseInt(condition.value) + 1;
        item.condition = '= ' + condition.value;
      } else if (condition.operator == 'lt') {
        item.count = parseInt(condition.value);
        item.condition = '< ' + condition.value;
      } else if (condition.operator == 'gt') {
        item.count = parseInt(condition.value) + 2;
        item.condition = '> ' + condition.value;
      } else {
        throw "Unknown condition operator " + condition.operator;
      }
    }
    verbose && console.log(`    Address:  ${condition.address}`);
    verbose && console.log(`    Operator: ${condition.operator}`);
    verbose && console.log(`    Value:    ${condition.value}`);
    verbose && console.log();
  }

  verbose && console.log(`  Actions:`);
  for (let action of rule.actions) {
    var act = {};
    if (isSpecialGroupAction(action)) {
      act.name = 'Some lights';
      act.action = actionDisplayString(action.body);
      if (typeof(action.body.scene) === 'string') {
        act.scene = 'Custom settings';
        act.lights = [];
        for (let light of allScenes[action.body.scene].lights) {
          act.lights.push(allLights[light]);
        }
        act.name = act.lights.join(', ');
      }

      if (typeof(action.body.bri_inc) !== 'undefined') {
        act.brighten = Math.abs(parseInt(action.body.bri_inc));
      }
      verbose && console.log(`    Address: ${action.address}`);
      verbose && console.log(`    Method:  ${action.method}`);
      verbose && console.log(`    Body:    ${JSON.stringify(action.body)}`);
    } else if (isGroupAction(action)) {
      act.name = groupNameFromAction(action);
      act.action = actionDisplayString(action.body);
      if (typeof(action.body.scene) === 'string') {
        act.scene = allScenes[action.body.scene].name;
      }
      if (typeof(action.body.bri_inc) !== 'undefined') {
        act.brighten = Math.abs(parseInt(action.body.bri_inc));
      }
      verbose && console.log(`    Address: ${action.address}`);
      verbose && console.log(`    Method:  ${action.method}`);
      verbose && console.log(`    Body:    ${JSON.stringify(action.body)}`);
    } else if (isCounterAction(action)) {
      // Probably don't need to display these
      act.name = "SET COUNTER " + counterNameFromAddress(action.address);
      act.nextStatus = action.body.status;
      verbose && console.log(`    Address: ${action.address}`);
      verbose && console.log(`    Method:  ${action.method}`);
      verbose && console.log(`    Body:    ${JSON.stringify(action.body)}`);
    } else {
      console.log(`    Address: ${action.address}`);
      verbose && console.log(`    Method:  ${action.method}`);
      console.log(`    Body:    ${JSON.stringify(action.body)}`);
    }
    if (typeof(act.name) === 'string') {
      item.actions.push(act);
    }
  }

  return item;
}

function printRule(item) {
  if (!verbose && item.isRelease) {
    return;
  }
  var buttonColor;
  if (item.button == 1) {
    buttonColor = colors.cyan;
  } else if (item.button == 2) {
    buttonColor = colors.yellow;
  } else if (item.button == 3) {
    buttonColor = colors.blue;
  } else if (item.button == 4) {
    buttonColor = colors.magenta;
  } else {
    buttonColor = colors.red;
  }

  var pressColor = colors.white;
  if (item.isLongPress) {
    pressColor = colors.white.italic;
  }

  var message = buttonColor(`Button ${item.button}`);
  message += pressColor(
      ` ${item.isLongPress ? 'long ' : ''}${item.isRelease ? 'release' : 'press'}${(typeof(item.count) == 'undefined' ? '' : ' ' + item.count)}`);
  message +=
      ` [Rule ${item.rule}]`.gray;
  if (typeof(item.conditionSensor) == 'string') {
    message += ` (Sensor ${item.conditionSensor} ${item.condition})`.green.dim;
  }

  console.log(message);
  printActions(item.actions);
  console.log();
}

function compareRules(rule1, rule2) {
  if (rule1.button > rule2.button) {
    return 1;
  } else if (rule1.button < rule2.button) {
    return -1;
  } else {
    if (rule1.isRelease && !rule2.isRelease) {
      return 1;
    } else if (!rule1.isRelease && rule2.isRelease) {
      return -1;
    } else {
      if (rule1.isLongPress && !rule2.isLongPress) {
        return 1;
      } else if (!rule1.isLongPress && rule2.isLongPress) {
        return -1;
      } else {
        if (typeof(rule1.count) == 'undefined') {
          return 0;
        } else {
          if (rule1.count > rule2.count) {
            return 1;
          } else if (rule1.count < rule2.count) {
            return -1;
          }
        }
      }
    }
  }
  return 0;
}

function isButtonAction(condition, sensor) {
  return condition.address == '/sensors/' + sensor + '/state/buttonevent';
}

function isCounterCondition(condition) {
  return /\/sensors\/\d+\/state\/status/.exec(condition.address);
}

function sensorNameFromCondition(condition) {
  var res = /\/sensors\/(\d+)\/state\/status/.exec(condition.address);
  if (res == null) {
    return null;
  } else {
    return res[1];
  }
}

function isGroupAction(action) {
  return /\/groups\//.exec(action.address);
}

function isSpecialGroupAction(action) {
  return /\/groups\/0\//.exec(action.address);
}

function isCounterAction(action) {
  return /\/sensors\/\d+\/state/.exec(action.address);
}

function counterNameFromAddress(address) {
  return /\/sensors\/(\d+)\//.exec(address)[1];
}

function groupNameFromAction(action) {
  var i = /\/groups\/(\d+)\//.exec(action.address)[1];
  return allGroups[i];
}

function actionDisplayString(action) {
  if (action.on === false) {
    return "Turn OFF";
  }
  if (action.on === true) {
    return "Turn ON";
  }
  if (typeof(action.scene) === 'string') {
    return "Turn ON";
  }
  if (typeof(action.bri_inc) !== 'undefined') {
    if (action.bri_inc <= 0) {
      return "DIM DOWN";
    } else {
      return "DIM UP";
    }
  }
  return JSON.stringify(action);
}

function printActions(actions) {
  for (let action of actions) {
    if (/^Turn ON/.exec(action.action)) {
      console.log('  ' + action.action.green + ' ' + action.name + (typeof(action.scene) == 'string' ? ' (' + action.scene + ')' : ''));
    } else if (/^Turn OFF/.exec(action.action)) {
        console.log('  ' + action.action.red + ' ' + action.name + (typeof(action.scene) == 'string' ? ' (' + action.scene + ')' : ''));
    } else if (/^DIM UP/.exec(action.action)) {
      console.log('  ' + action.action.white + ' ' + action.name + ' by ' + action.brighten);
    } else if (/^DIM DOWN/.exec(action.action)) {
      console.log('  ' + action.action.white.italic + ' ' + action.name + ' by ' + action.brighten);
    } else if (/^SET COUNTER/.exec(action.name)) {
      console.log(`  ${action.name} to ${action.nextStatus}`.green.dim);
    } else {
      console.log('  ' + JSON.stringify(action));
    }
  }
}
