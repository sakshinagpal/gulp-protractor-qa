/**
 * Created by Sakshi on 4/6/2016.
 */
var fs = require('fs');
var util = require('util');
var gutil = require('gulp-util');
var cheerio = require('cheerio');
var async = require('async');
var EventEmitter = require('events');
var _ = require('underscore');

// `GulpProtractorQA` sub-modules dependecies
var storeFileContent = require('./lib/store-file-content');
var findSelectors = require('./lib/find-selectors');
var findViewMatches = require('./lib/find-view-matches');
var consoleOutput = require('./lib/console-output');
var watchFilesChange = require('./lib/watch-files-change');

// Constant
var PLUGIN_NAME = 'gulp-protractor-qa';

// Define `GulpProtractorQA` class.
// @class
function GulpProtractorQA() {
    this.testFiles = [];
    this.viewFiles = [];
    this.selectors = [];
    this.watchIsRunning = 0;
    this.isFirstLoad = 1;
}

// Inherit EventEmitter.
util.inherits(GulpProtractorQA, EventEmitter);

// Init application.
//
// @param {Object} options
// @param {string} options.testSrc - Glob pattern string point to test files
// @param {string} options.viewSrc - Glob pattern string point to view files
// @param {boolean} options.runOnce - Flag to decide whether it should watch files changes or not
GulpProtractorQA.prototype.init = function(options) {
    var self = this;
    this.options = options || {};

    if (!this.options.testSrc) {
        throw new gutil.PluginError(PLUGIN_NAME, '`testSrc` required');
    }
    if (!this.options.viewSrc) {
        throw new gutil.PluginError(PLUGIN_NAME, '`viewSrc` required!');
    }
    readFiles.call(this, function (notFoundItems) {
        if(self.options.onComplete){
            self.options.onComplete(notFoundItems);
        }
    });

}

// Read `testSrc` and `viewSrc` files content.
function readFiles(callback) {

    var self = this;

    async.waterfall([
        function(callback) {
            storeFileContent.init(self.options.testSrc, callback);
        },
        function(data, callback) {
            if((data[0].content)==='')
                throw new Error('Blank file: '+data[0].path)
            self.testFiles = data;
            storeFileContent.init(self.options.viewSrc, callback);
        },
        function(data, callback) {
            if((data[0].content)==='')
                throw new Error('Blank file: '+data[0].path)
            self.viewFiles = data;
            callback(null, 'success');
        }
    ], function(err, data) {
        findElementSelectors.call(self,callback);
    });
}


// Loop through test files and find protractor
// selectors (e.g.: by.css('[href="/"]')).
function findElementSelectors(callback) {
    var self = this;
    // reset selectors
    this.selectors = [];

    this.testFiles.forEach(function(item) {
        self.selectors = self.selectors.concat(findSelectors.init(item));
    });

    checkSelectorViewMatches.call(this,callback);
}

function checkSelectorViewMatches(callback) {
    var self = this;
    // Set all selectors to not found
    this.selectors.forEach(function(item) {
        item.found = 0;
    });

    // Check if selectors are findable
    this.viewFiles.forEach(function(item) {
        findViewMatches(self.selectors, item.content);
    });

    outputResult.call(this,callback);
}

function outputResult(callback) {
    var self = this;
    var notFoundItems = _.filter(this.selectors, function(item) {
        return (!item.found && !item.disabled);
    });

    consoleOutput.printFoundItems(notFoundItems,function(notfounditems){
        if (self.isFirstLoad) {
            warnWatchedSelectors.call(self);
            self.isFirstLoad = 0;
            callback(notfounditems);
        }
       /* if (!this.options.runOnce && !this.watchIsRunning) {
            startWatchingFiles.call(this);
        }*/
    });

    // On first run warn watched selectors.

}

function startWatchingFiles() {
    this.watchIsRunning = 1;

    // Init gaze.
    watchFilesChange.call(this);

    // Listen to change event
    this.on('change', onFileChange.bind(this));
}

function onFileChange(data) {
    if (data.fileType === 'test') {
        updateSelectors.call(this, data);
    }

    checkSelectorViewMatches.call(this);
}

function updateSelectors(data) {
    var filtered = _.filter(this.selectors, function(selector) {
        return !(selector.path === data.path);
    });
    var updatedTestFile = this.testFiles[data.index];
    var newSelectors;

    if (updatedTestFile) {
        newSelectors = findSelectors.init(updatedTestFile);
        this.selectors = filtered.concat(newSelectors);
    }
}

function warnWatchedSelectors() {
    var total = this.selectors.length;

    var filtered = _.filter(this.selectors, function(selector) {
        return !selector.disabled;
    });

    // Output `X` out `total` are being watched.
    consoleOutput.watchedLocators(filtered.length, total);
}

// Exporting the plugin main function
module.exports = new GulpProtractorQA();
