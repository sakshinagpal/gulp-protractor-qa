var gutil = require('gulp-util');
var chalk = require('chalk');
var PLUGIN_NAME = 'gulp-protractor-qa';

function ConsoleOutput() {}

/*ConsoleOutput.prototype.printFoundItems = function(notFoundItems) {
	if (notFoundItems.length > 0) {
		notFoundItems.forEach(function(item) {
				outputNotFound(item);
		});
	} else {
		this.printGreen('\u2714 All test elements were successfully found!');
	}
}*/

ConsoleOutput.prototype.printFoundItems = function(notFoundItems,callback) {
	if (notFoundItems.length > 0) {
		var loop = function(i,done){
			outputNotFound(notFoundItems[i],function(){
				if(++i < notFoundItems.length)
					loop(i,done)
				else
					done();
			});
		}

		loop(0,function(){
			callback(notFoundItems)
		});
/*		notFoundItems.forEach(function(item) {
			outputNotFound(item);
		});*/

	} else {
		this.printGreen('\u2714 All test elements were successfully found!');
		callback(notFoundItems);
	}
}


ConsoleOutput.prototype.watchedLocators = function(number, total) {
	gutil.log([
		'[', chalk.cyan(PLUGIN_NAME), '] ',
		chalk.gray(
			'// ' + number + ' out of ' +
			total + ' element selectors were considered.'
		)
	].join(''));
}

ConsoleOutput.prototype.printBlue = function(text) {
	gutil.log([
		'[', chalk.cyan(PLUGIN_NAME), '] ',
		chalk.blue(text)
	].join(''));
}

ConsoleOutput.prototype.printGreen = function(text) {
	gutil.log([
		'[', chalk.cyan(PLUGIN_NAME), '] ',
		chalk.green(text)
	].join(''));
}

function outputNotFound(item,callback) {
	gutil.log([
		'[', chalk.cyan(PLUGIN_NAME), '] ',
		chalk.red('\u2718 by.' + item.type + ': '),
		chalk.red(item.value),
		' at ', chalk.bold(item.path), ':', item.line
	].join(''));
	callback();
}

module.exports = new ConsoleOutput();