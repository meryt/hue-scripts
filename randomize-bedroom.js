#!/usr/bin/env node

// Usage:
//
// randrgb --- get 10 random colors of random lightness
// randrgb [bright|light|dark] ---- get 10 random colors of this luminosity
// randrgb <huename> --- get 10 random colors of this hue
//      (red, orange, yellow, green, blue, purple, pink, monochrome (for grays))
// randrgb [bright|light|dark] <huename> ---- get 10 colors of this lightness & hue

var randomColor = require ('randomcolor');
var sample = require('lodash.sample');
var config = require('./config.js');

var client = config.huejay;

var lights = [
    {"id": 4, "brightness": 255}, // bedside lamp
    {"id": 35, "brightness": 128}, // ceiling 1
    {"id": 36, "brightness": 128} // ceiling 2
];

// Initialize by picking  a random hue from the list
var hue = sample(['red', 'red', 'orange', 'yellow', 'green', 'green', 'blue', 'blue', 'purple', 'purple', 'pink', 'pink', 'random']);
var luminosity = 'bright';
var count = 3;

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

console.log(`Setting lights to ${luminosity} ${hue}`);


var options = {
    format: 'hsl',
    luminosity: luminosity,
    count: lights.length,
    hue: hue
};

var colorstr = randomColor(options);

if (typeof(colorstr) == 'object') {
    for (var i = 0; i < colorstr.length; i++) {
        setLightToColor(lights[i].id, lights[i].brightness, hslToHue(colorstr[i]))
    }
} else {
    setLightToColor(lights[i].id, lights[i].brightness, hslToHue(colorstr[i]))
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
