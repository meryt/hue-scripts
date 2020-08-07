#!/usr/bin/env node

var config = require('./config.js');
var client = config.huejay;

var moment = require('moment');

var Utils = require('./utils.js');

const HSL_RED = 0;
const HSL_CYAN = 184;
const HSL_BLUE = 208;
const HSL_VIOLET = 276;

// Color range for no precip should range from cyan (freezing) to red
const MIN_HUE_NO_PRECIP = HSL_CYAN;
const MAX_HUE_NO_PRECIP = HSL_RED;
// Color range for precip should range from violet (snow) to blue
const MIN_HUE_PRECIP = HSL_VIOLET;
const MAX_HUE_PRECIP = HSL_BLUE;

const MIN_TEMP = -10;
const MAX_TEMP = 32;


let lights = [
    {"id": 29, "brightness": 128}, // enguerrand
    {"id": 26, "brightness": 128}, // bob
    {"id": 28, "brightness": 128}, // joey
    {"id": 27, "brightness": 128}, // frank
    {"id": 30, "brightness": 128}, // brian
    {"id": 32, "brightness": 128}, // upstairs hallway 3
    {"id": 33, "brightness": 128}, // upstairs hallway 4
];
let chandelierBulbs = [lights[0], lights[1], lights[2], lights[3], lights[4]];

let useRealWeather = true;
if (useRealWeather) {
	Utils.getWeather(config.openWeatherApiKey, config.lat, config.lon, setLightsFromWeather);
} else {
	var weather = require('./sample-weather.js');
	setLightsFromWeather(weather);
}


function setLightsFromWeather(weather) {
	setHallwayFromCurrentConditions(weather, lights[5], lights[6]);
	setChandelierFromHourlyForecast(weather, 4);
}


function setHallwayFromCurrentConditions(weather, tempBulb, conditionBulb) {
	let currentRainMm = weather.current.rain ? weather.current.rain['1h'] : 0;
	let currentTemp = weather.current.temp;
	let currentWeather = weather.current.weather[0].description;
	let feelsLike = weather.current.feels_like;
	let currentCode = weather.current.weather[0].id;


	let codeGroup = String(currentCode).substring(0, 1);
	let isRaining = ['2', '3', '5', '6'].includes(codeGroup); // see averageWeather function for explanation

	let tempBulbHue = hueFromTemp(currentTemp, false);
	let conditionBulbHue = hueFromTemp(currentTemp, true);
	if (!isRaining) {
		conditionBulbHue = hueFromTemp(feelsLike, false);
	}

	let tempBulbHueHue = Utils.hslHueToHueHue(tempBulbHue);
	let conditionBulbHueHue = Utils.hslHueToHueHue(conditionBulbHue);

	let log1 = `Currently:   Temperature  ${formatTemp(currentTemp)}C,`;
	let log2 = `  feels like ${formatTemp(feelsLike)}C,    ${currentWeather}`;

	console.log(Utils.colorizeForeground(Utils.hueToRgb(tempBulbHue), log1) + 
		Utils.colorizeForeground(Utils.hueToRgb(conditionBulbHue), log2));

	Utils.setLightToHue(client, tempBulb.id, tempBulb.brightness, tempBulbHueHue);
	Utils.setLightToHue(client, conditionBulb.id, conditionBulb.brightness, conditionBulbHueHue);

}

function setChandelierFromHourlyForecast(weather, numHoursPerBulb) {

	let numBulbs = chandelierBulbs.length;

	for (var bulb = 0; bulb < numBulbs; bulb++) {
		var totalTemp = 0;
		var maxPop = 0;
		var firstHour = weather.hourly[bulb * numHoursPerBulb];
		var weathers = [];
		for (var i = 0; i < numHoursPerBulb; i++) {
			let hourly = weather.hourly[bulb * numHoursPerBulb + i];
			let hourlyTemp = hourly.temp;
			let hourlyWeather = hourly.weather[0].description;
			let pop = hourly.pop;
			if (pop > maxPop) {
				maxPop = pop;
			}
			totalTemp += hourlyTemp;
			weathers.push(hourly.weather[0]);
		}
		var avgTemp = totalTemp / numHoursPerBulb;

		var newHue = hueFromTemp(avgTemp, maxPop >= 0.30);
		var hueHue = Utils.hslHueToHueHue(newHue);

		var start = moment.unix(firstHour.dt);
		var end = moment.unix(firstHour.dt).add(numHoursPerBulb, 'hours');

		let averageWeatherForPeriod = averageWeather(weathers);

		let logline = `${formatHour(start)} - ${formatHour(end)}: Avg. temp  ${formatTemp(avgTemp)}C,  precip. chance ${String(Math.round(maxPop * 100)).padStart(2, ' ')}%,  ${averageWeatherForPeriod.description}`;

		console.log(Utils.colorizeForeground(Utils.hueToRgb(newHue), logline));

		var bulbId = chandelierBulbs[bulb].id;
		var bulbBright = chandelierBulbs[bulb].brightness;

		Utils.setLightToHue(client, bulbId, bulbBright, hueHue);

	}	
}


function formatHour(mom) {
	return mom.format('h A').padStart(5, ' ');
}


function hueFromTemp(temp, isRaining) {
	if (temp > MAX_TEMP) {
		temp = MAX_TEMP;
	}
	if (temp < MIN_TEMP) {
		temp = MIN_TEMP;
	}

	let hslHue = isRaining
		? interpolate(MIN_HUE_PRECIP, MAX_HUE_PRECIP, temp)
		: interpolate(MIN_HUE_NO_PRECIP, MAX_HUE_NO_PRECIP, temp);

	return hslHue;
}

function interpolate(minHue, maxHue, num) {
	var distance = (num - MIN_TEMP) / (MAX_TEMP - MIN_TEMP);
    return minHue + distance * (maxHue - minHue);
}

/**
 * Given a list of weather conditions for some hours, find the most pertinent description for the weather.
 * For example, if any hour is described as Thunderstorm, return that. Snow is more important than rain,
 * rain is more important than drizzle, drizzle is more important than clouds, etc.
 */
function averageWeather(conditions) {
	// 2xx Thunderstorms
	// 3xx Drizzle
	// 5xx Rain
	// 6xx Snow
	// 7xx Atmosphere
	// 800 Clear
	// 8xx Clouds
	let groups = ['2xx', '6xx', '5xx', '3xx', '7xx', '8xx', '800'];

	for (var group of groups) {
		let groupNum = group.substring(0, 1);
		for (var condition of conditions) {
			let code = condition.id;
			let codeNum = String(code).substring(0, 1);
			if (group.endsWith('xx')) {
				// The first (earliest) match for the highest ranking code will be returned.
				if (groupNum == codeNum) {
					return condition;
				}
			// Handle the 800 Clear case
			} else if (group == code) {
				return condition;
			}
		}
	}
	return conditions[0];
}

function formatTemp(temp) {
	return temp.toFixed(1);
}
