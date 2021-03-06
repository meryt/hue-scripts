#!/usr/bin/env node

var randomColor = require ('randomcolor');
var sample = require('lodash.sample');
var config = require('./config.js');

var client = config.huejay;

var lights = [
    {"id": 25}, // 25 = black desk lamp candle bulb
];

// brightness of lamp; values range between 0 and 255
var brightnesses = {
    'dark': 80,
    'light': 160,
    'bright': 255
}



// Initialize by picking  a random hue from the list. Some colors are more likely than others.
var hue = sample(['red', 'red', 'orange', 'yellow', 'green', 'green', 'blue', 'blue', 'purple', 'purple', 'pink', 'pink', 'random']);
// Default brightness is bright (maximum brightness)
var luminosity = 'bright';

if (process.argv.length >= 2 && (process.argv[2] == '-h' || process.argv[2] == '--help')) {
    console.log('Usage: desklamp.js                        - turn on with random bright color');
    console.log('       desklamp.js [hue]                  - turn on with specified bright color');
    console.log('       desklamp.js [brightness] [hue]     - turn on with specified luminosity and color');
    console.log('       desklamp.js [-h | --help]          - display this message');
    console.log('');
    console.log('       hue        -- red  orange  yellow  green  blue  purple  pink  random');
    console.log('       brightness -- dark  light  bright');
    process.exit();
}

if (process.argv.length == 4) {
    // e.g. randrgb light blue
    luminosity = process.argv[2];
    hue = process.argv[3];
} else if (process.argv.length == 3) {
    var v = process.argv[2];
    if (v == 'light' || v == 'bright' || v == 'dark') {
        // e.g. randrgb dark
        luminosity = v;
    } else {
        // e.g. randrgb green
        hue = v;
    }
}

if (!(luminosity in brightnesses)) {
    console.error(`Invalid value "${luminosity}" for brightness. Valid values are: dark, light, bright`);
    process.exit(1);
}

console.log(`Setting light${lights.length == 1 ? '' : 's'} to ${luminosity} ${hue}`);

var brightness = brightnesses[luminosity];

var randColorOptions = {
    format: 'hsl',
    luminosity: 'bright',
    count: lights.length,
    hue: hue
};

var colorstr = randomColor(randColorOptions);

if (typeof(colorstr) == 'object') {
    for (var i = 0; i < colorstr.length; i++) {
        setLightToColor(lights[i].id, brightness, hslToHue(colorstr[i]))
    }
} else {
    setLightToColor(lights[i].id, brightness, hslToHue(colorstr[i]))
}

function hslToHue(hsl) {
    var regex = /hsl\((\d+), .+/;
    var matches = regex.exec(hsl);
    var hue = hslHueToHueHue(matches[1]);
    return hue;
}

function hslHueToHueHue(hue) {
    // hsl hues go from 0 to 360
    // philips hue hues go from 0 to 65535
    return Math.round(hue * (65535 / 360));
}

function setLightToColor(lightId, brightness, color) {
    client.lights.getById(lightId)
        .then(light => {
            light.brightness = brightness;
            light.hue        = color;
            light.saturation = 255;
            light.on = true;

            return client.lights.save(light);
        })
        .then(light => {
            //console.log(`Updated light [${light.id}]`);
        })
        .catch(error => {
            console.log(error.stack);
        });
}
