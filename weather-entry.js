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
const MAX_TEMP = 30;

// Min percent chance of precip to change to blue
const PRECIP_THRESHOLD = 0.4;


let lights = [
    {"id": 4, "brightness": 255}, // candle 8 o'clock
    {"id": 7, "brightness": 255}, // 6 o'clock
    {"id": 8, "brightness": 255}, // 4 o'clock
    {"id": 9, "brightness": 255}, // 10 o'clock
    {"id": 10, "brightness": 255}, // 12 o'clock
    {"id": 11, "brightness": 255}, // 2 o'clock
    {"id": 32, "brightness": 128}, // upstairs hallway 3
    {"id": 33, "brightness": 128}, // upstairs hallway 4
    {"id": 31, "brightness": 128}, // bedroom globe
];
let chandelierBulbs = [lights[4], lights[5], lights[2], lights[1], lights[0], lights[3]];

let useRealWeather = true;
if (useRealWeather) {
	Utils.getWeather(config.openWeatherApiKey, config.lat, config.lon, setLightsFromWeather);
} else {
	var weather = require('./sample-weather.js');
	setLightsFromWeather(weather);
}


function setLightsFromWeather(weather) {
	let currentlyRaining = isRaining(weather)
	//setHallwayFromCurrentConditions(weather, currentlyRaining, lights[5], lights[6]);
	//setBedroomGlobeFromCurrentHourForecast(weather, currentlyRaining, lights[7]);
	//setChandelierFromHourlyForecast(weather, 2);
	setNewChandelierFromHourlyForecast(weather);
}

function isRaining(weather) {
	let currentCode = weather.current.weather[0].id;
	let codeGroup = String(currentCode).substring(0, 1);
	return ['2', '3', '5', '6'].includes(codeGroup); // see averageWeather function for explanation
}

function setHallwayFromCurrentConditions(weather, isRaining, tempBulb, conditionBulb) {
	let currentRainMm = weather.current.rain ? weather.current.rain['1h'] : 0;
	let currentTemp = weather.current.temp;
	let currentWeather = weather.current.weather[0].description;
	let feelsLike = weather.current.feels_like;

	let tempBulbHue = hueFromTemp(currentTemp, isRaining);
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

		var newHue = hueFromTemp(avgTemp, maxPop >= PRECIP_THRESHOLD);
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

function setNewChandelierFromHourlyForecast(weather) {

	var firstHourWeather = weather.hourly[0]
	var firstHour = hourFromHourlyWeather(firstHourWeather); 
	var numReadings = 12;
	if (firstHour % 2) {
		numReadings = 11;
	}

	const hours = {};

	for (var i = 0; i < numReadings; i++) {
		let hourlyWeather = weather.hourly[i]
		let hour = hourFromHourlyWeather(hourlyWeather)
		hours[hour] = {};
		hours[hour]['hour'] = formatHour(moment.unix(hourlyWeather.dt))
		hours[hour]['temp'] = hourlyWeather.temp;
		hours[hour]['description'] = hourlyWeather.weather[0].description;
		hours[hour]['weather'] = hourlyWeather.weather[0];
		hours[hour]['pop'] = hourlyWeather.pop;
	}

	const bulbSettings = {}

	for (var i = 0; i < 12; i+= 2) {
		
		let totalTemp = 0
		let maxPop = 0
		let numReadings = 0

		let bulbSetting = {}
		let bulbIndex = i / 2;
		bulbSettings[bulbIndex] = bulbSetting

		let idx = i + ''
		let idx2 = (i + 1) + ''
		let weathers = []
		if (hours[idx]) {
			weathers.push(hours[idx].weather)
			totalTemp += hours[idx].temp
			numReadings++
			if (hours[idx].pop > maxPop) {
				maxPop = hours[idx].pop
			}
		}
		if (hours[idx2]) {
			weathers.push(hours[idx2].weather)
			totalTemp += hours[idx2].temp
			numReadings++
			if (hours[idx2].pop > maxPop) {
				maxPop = hours[idx2].pop
			}
		}
		var avgTemp = totalTemp / numReadings
		
		var newHue = hueFromTemp(avgTemp, maxPop >= PRECIP_THRESHOLD);
		var hueHue = Utils.hslHueToHueHue(newHue);

		bulbSetting['averageWeather'] = averageWeather(weathers)
		bulbSetting['start'] = hours[idx] ? hours[idx]['hour'] : '     '
		bulbSetting['end'] = hours[idx2]['hour']
		bulbSetting['avgTemp'] = avgTemp
		bulbSetting['pop'] = maxPop

		let logline = `${bulbSetting['start']} - ${bulbSetting['end']}: Avg. temp  ${formatTemp(bulbSetting['avgTemp'])}C,  precip. chance ${String(Math.round(bulbSetting['pop'] * 100)).padStart(2, ' ')}%,  ${bulbSetting.averageWeather.description}`;

		console.log(Utils.colorizeForeground(Utils.hueToRgb(newHue), logline));

		var bulbId = chandelierBulbs[bulbIndex].id;
		var bulbBright = chandelierBulbs[bulbIndex].brightness;

		Utils.setLightToHue(client, bulbId, bulbBright, hueHue);


	}

}

function setBedroomGlobeFromCurrentHourForecast(weather, isRaining, light) {
	var nextHour = weather.hourly[0];
	var temp = nextHour.temp;
	var description = nextHour.weather[0].description;
	var pop = nextHour.pop;
	var isOrWillRaining = isRaining || pop >= PRECIP_THRESHOLD;

	var newHue = hueFromTemp(temp, isOrWillRaining);
	var hueHue = Utils.hslHueToHueHue(newHue);
	var start = moment.unix(nextHour.dt);
	var end = moment.unix(nextHour.dt).add(1, 'hours');

    let logline = `This hour:   Temperature  ${formatTemp(temp)}C,  precip. chance ${String(Math.round(pop * 100)).padStart(2, ' ')}%,  ${description}`;
	console.log(Utils.colorizeForeground(Utils.hueToRgb(newHue), logline));

	var bulbId = light.id;
	var bulbBright = light.brightness;

	Utils.setLightToHue(client, bulbId, bulbBright, hueHue);

}

function formatHour(mom) {
	return mom.format('h A').padStart(5, ' ');
}

function hourFromHourlyWeather(hourlyWeather) {
	return new Date(hourlyWeather.dt * 1000).getHours() % 12;
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
