
/**
 * convert a HSL hue value (0 to 360) to a
 * Philips Hue hue value (0 to 65535)
 */
exports.hslHueToHueHue = function (hue) {
    return Math.round(hue * (65535 / 360));
}

exports.hueToRgb = function(hue) {
	let converter = require('hsl-to-rgb-for-reals');
	return converter(hue, 1, 0.7);
}

exports.colorizeForeground = function(rgb, str) {

	let rgbCode = `${rgb[0]};${rgb[1]};${rgb[2]}`;

    // set foreground color
    var text = '\x1b[38;2;' + rgbCode + 'm';

    // set text
    text += str;

    // set back to normal
    text += '\x1b[0m';

   return text;
}

exports.setLightToHue = function(client, lightId, brightness, hue) {
    client.lights.getById(lightId)
        .then(light => {
            light.brightness = brightness;
            light.hue        = hue;
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

exports.getWeather = function(apiKey, lat, lon, callback) {
	var request = require('request');
	var options = {
		method: 'GET',
		url: `https://api.openweathermap.org/data/2.5/onecall?appid=${apiKey}&lat=${lat}&lon=${lon}&units=metric`,

	};

	request(options, function(error, response, body) {
		if (error) throw new Error(error);
		callback(JSON.parse(body));
	});
}
