function $(expr, con) {
	return typeof expr === 'string'? (con || document).querySelector(expr) : expr;
}

function $$(expr, con) {
	return Array.prototype.slice.call((con || document).querySelectorAll(expr));
}

// Make each ID a global variable
// Many browsers do this anyway (it’s in the HTML5 spec), so it ensures consistency
$$('[id]').forEach(function(element) { window[element.id] = element; });

var messages = {
	'error': 'Please enter valid colours 🎨',
	'fail': 'Fails 😩',
	'aa-large': 'Only passes for large text (above 18pt or bold above 14pt) 🗣',
	'aa': 'Passes AA level for any size text and AAA for large text (above 18pt or bold above 14pt) 😀',
	'aaa': 'Passes AAA level for any size text 🎉'
};

incrementable.onload = function() {
	if (window.Incrementable) {
		new Incrementable(background);
		new Incrementable(foreground);
	}
};

if (window.Incrementable) {
	incrementable.onload();
}

var output = $('output');

var levels = {
	'fail': {
		range: [0, 3],
		color: 'hsl(0, 100%, 40%)'
	},
	'aa-large': {
		range: [3, 4.5],
		color: 'hsl(40, 100%, 45%)'
	},
	'aa': {
		range: [4.5, 7],
		color: 'hsl(80, 60%, 45%)'
	},
	'aaa': {
		range: [7, 22],
		color: 'hsl(95, 60%, 41%)'
	}
};

function rangeIntersect(min, max, upper, lower) {
	return (max < upper? max : upper) - (lower < min? min : lower);
}

function updateLuminance(input) {
	input.title = 'Relative luminance: ';

	var color = input.color;

	if (input.color.alpha < 1) {
		input.title += color.overlayOn(Color.BLACK).luminance + ' - ' + color.overlayOn(Color.WHITE).luminance;
	}
	else {
		input.title += color.luminance;
	}
}

function update() {
	if (foreground.color && background.color) {
		if (foreground.value !== foreground.defaultValue || background.value !== background.defaultValue) {
			window.onhashchange = null;

			location.hash = '#' + encodeURIComponent(foreground.value) + '-on-' + encodeURIComponent(background.value);

			setTimeout(function() {
				window.onhashchange = hashchange;
			}, 10);
		}

		var contrast = background.color.contrast(foreground.color);

		updateLuminance(background);
		updateLuminance(foreground);

		var min = contrast.min,
		    max = contrast.max,
		    range = max - min,
		    classes = [], percentages = [];

		for (var level in levels) {
			var bounds = levels[level].range,
			    lower = bounds[0],
			    upper = bounds[1];

			if (min < upper && max >= lower) {
				classes.push(level);

				percentages.push({
					level: level,
					percentage: 100 * rangeIntersect(min, max, upper, lower) / range
				});
			}
		}

		$('strong', output).textContent = contrast.ratio;

		if (classes.length <= 1) {
			results.textContent = messages[classes[0]];
			output.style.backgroundImage = '';
			output.style.backgroundColor = levels[classes[0]].color;
		}
		else {
			var fragment = document.createDocumentFragment();

			var p = document.createElement('p');
			p.textContent = messages.error;
			fragment.appendChild(p);


			var message = '<p></p>';

			results.textContent = '';
			results.appendChild(fragment);


		}
	}
}

function colorChanged(input) {

	var isForeground = input == foreground;

	var display = isForeground? foregroundDisplay : backgroundDisplay;

	var previousColor = getComputedStyle(display).backgroundColor;

	// Match a 3 digit hex code, add a hash in front.
	if(input.value.match(/^[0-9a-f]{3}$/i)) {
		input.value = '#' + input.value;
	}

	display.style.background = input.value;

	var color = getComputedStyle(display).backgroundColor;

	if (color && input.value && (color !== previousColor || color === 'transparent' || color === 'rgba(0, 0, 0, 0)')) {
		// Valid & different color
		if (isForeground) {
			backgroundDisplay.style.color = input.value;
		}

		input.color = new Color(color);

		return true;
	}

	return false;
}

function hashchange() {

	if (location.hash) {
		var colors = location.hash.slice(1).split('-on-');

		foreground.value = decodeURIComponent(colors[0]);
		background.value = decodeURIComponent(colors[1]);
	}
	else {
		foreground.value = foreground.defaultValue;
		background.value = background.defaultValue;
	}

	background.oninput();
	foreground.oninput();
}

background.oninput =
foreground.oninput = function() {
	var valid = colorChanged(this);

	if (valid) {
		update();
	}
};

function changeBackground(obj) {
  document.getElementById("swap").style.background = document.getElementById("background").value;
	document.getElementById("backgroundDot").style.background = document.getElementById("background").value;
}

function changeForeground(obj) {
  document.getElementById("swap").style.color = document.getElementById("foreground").value;
	document.getElementById("foregroundDot").style.background = document.getElementById("foreground").value;
}

swap.onclick = function() {
	var backgroundColor = background.value;
	background.value = foreground.value;
	foreground.value = backgroundColor;

	colorChanged(background);
	colorChanged(foreground);

	document.getElementById("swap").style.background = document.getElementById("background").value;
	document.getElementById("swap").style.color = document.getElementById("foreground").value;
	document.getElementById("foregroundDot").style.background = document.getElementById("foreground").value;
	document.getElementById("backgroundDot").style.background = document.getElementById("background").value;

	update();
};

window.encodeURIComponent = (function(){
	var encodeURIComponent = window.encodeURIComponent;

	return function (str) {
		return encodeURIComponent(str).replace(/[()]/g, function ($0) {
			return escape($0);
		});
	};
})();

window.decodeURIComponent = (function(){
	var decodeURIComponent = window.decodeURIComponent;

	return function (str) {
		return str.search(/%[\da-f]/i) > -1? decodeURIComponent(str) : str;
	};
})();

(onhashchange = hashchange)();
