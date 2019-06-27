/*
 Copyright (C) 2014 Martin Franke (martin@semiwa.org)

 This file is part of node-weka.

 node-weka is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 node-weka is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with node-weka.  If not, see <http://www.gnu.org/licenses/>.
 */

(function () {

  // Baseline setup (from underscore)
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `weka` variable.
  var previousUnderscore = root.weka;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Create a safe reference to the Weka object for use below.
  var weka = function (obj) {
    if (obj instanceof weka) {
      return obj;
    }
    if (!(this instanceof weka)) {
      return new _(obj);
    }
    //this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `weka` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = weka;
    }
    exports.weka = weka;
  } else {
    root.weka = weka;
  }

  // Current version
  weka.VERSION = '0.0.8';

  var sys = require('sys');
  var exec = require('child_process').exec;

  var child;
  var async = require('async');
  var _ = require('underscore');

  _.str = require('underscore.string');
  _.mixin(_.str.exports());
  _.str.include('Underscore.string', 'string');

  var fs = require('fs');

  /** JS Arff format back to weka arff format */
  function parseArffFile(arffObj, cb) {

    var arffFile = '';
    arffFile += '@relation ';
    arffFile += arffObj.name;
    arffFile += '\n\n';

    async.waterfall([
      function (callback) {

        var i = 0;

        async.eachSeries(arffObj.data, function (obj, dataCb) {

          async.eachSeries(_.keys(obj), function (key, mapCb) {

            if (arffObj.types[key].type.indexOf('nominal') > -1 && !_.isString(arffObj.data[i][key])) {
              arffObj.data[i][key] = arffObj.types[key].oneof[arffObj.data[i][key]];
            }

            mapCb();

          }, function (err) {
            i++;
            dataCb(err);
          });

        }, function (err) {
          callback(err);
        });

      },
      function (callback) {

        async.eachSeries(arffObj.attributes, function (obj, attrCb) {

          arffFile += '@attribute ';
          arffFile += obj;
          arffFile += ' ';

          if (arffObj.types[obj].type.indexOf('nominal') > -1) {
            arffFile += '{' + arffObj.types[obj].oneof + '}';
          } else {
            arffFile += arffObj.types[obj].type;
          }

          arffFile += '\n';

          attrCb();

        }, function (err) {
          callback(err);
        });

      },
      function (callback) {

        arffFile += '\n';
        arffFile += '@data';
        arffFile += '\n';

        async.eachSeries(arffObj.data, function (obj, dataCb) {

          arffFile += _.values(obj);
          arffFile += '\n';

          dataCb();

        }, function (err) {
          callback(err);
        });
      }
    ], function (err, result) {

      var fileId = '/tmp/node-weka-' + _.random(0, 10000000) + '.arff';

//    console.log(arffFile);

      fs.writeFile(fileId, arffFile, function (err) {
        cb(err, fileId);
      });

    });

  }

//TODO:
  exports.filter = function (data, input, output) {

//  parseArffFile(input);
//
//  //Filter Test
//  child = exec('weka ' + data.filter + ' ' + data.params + ' -i ./parse.arff -o ./test/result.arff', function (error, stdout, stderr) {
//    sys.print('stdout: ' + stdout);
//    sys.print('stderr: ' + stderr);
//    if (error !== null) {
//      console.log('exec error: ' + error);
//    }
//  });

  };

  exports.correlationMatrix = function (data, options, cb) {

    var fileIdTraining;

    async.waterfall([
      function (callback) {
        parseArffFile(data, callback);
      },
      function (fileIdTraining, callback) {

        var start = false;

        child = exec('java -classpath ./bin/weka.jar ' + options.evaluator + ' '
            + options.e_params +
            ' -s "' + options.ranker + '"' +
            ' -i ' + fileIdTraining,

          function (error, stdout, stderr) {

            var result = {};
            result.correlation = [];

            var splitted = stdout.split('\n');

            async.eachSeries(splitted, function (obj, callback) {

              var assignment = _.clean(obj).split(' ');

              if (assignment[0] === '') {
                start = false;
              }

              if (start) {
                result.correlation.push(assignment);
              }

              if (assignment[0].indexOf('Correlation') > -1) {
                start = true;
              }

              callback();

            }, function (err) {
              callback(error, result);
            });

          }
        )
        ;
      }
    ], function (err, result) {
      cb(err, result);
    });

  };

  /**
   * Build tranings set and classify the test item.
   * @param data Data in ARFF js format (node-arff)
   * @param test One test item
   * @param options Parameter for the classifier
   * @param cb Callback function
   */
  exports.classify = function (data, test, options, cb) {

    var fileIdTraining;

    async.waterfall([
      function (callback) {
        parseArffFile(data, callback);
      },
      function (fileId, callback) {
        fileIdTraining = fileId;

        var testFile = data;
        testFile.name = 'test';
        testFile.data = [];
        testFile.data.push(test);

        parseArffFile(testFile, callback);
      },

      function (fileIdTest, callback) {

//      console.log('weka ' + options.classifier + ' '
//        + options.params +
//        ' -t ' + fileIdTraining +
//        ' -T ' + fileIdTest +
//        ' -no-cv -v -p 0');

        child = exec('java -classpath ./bin/weka.jar ' + options.classifier + ' '
            + options.params +
            ' -t ' + fileIdTraining +
            ' -T ' + fileIdTest +
            ' -no-cv -v -p 0',
          function (error, stdout, stderr) {

            if(error){
              callback(error);
              return;
            }

//          console.log(stdout);

            var result = {};

            var splitted = _.clean(stdout.split('\n')[5]).split(' ');

            result.predicted = splitted[2].split(':')[1];
            result.prediction = splitted[splitted.length - 1];

            callback(error, result);

          });
      }
    ], function (err, result) {
      cb(err, result);
    });

  };

  exports.cluster = function (data, options, cb) {

    var fileIdTraining;

    async.waterfall([
      function (callback) {
        parseArffFile(data, callback);
      },
      function (fileIdTraining, callback) {

        child = exec('java -classpath ./bin/weka.jar ' + options.clusterer + ' '
            + options.params +
            ' -t ' + fileIdTraining +
            ' -p 0',

          function (error, stdout, stderr) {

            // console.log(stdout);

            var result = {};
            result.assignments = [];

            var splitted = stdout.split('\n');

            async.eachSeries(splitted, function (obj, callback) {

              var assignment = _.clean(obj).split(' ')[1];

              if (!_.isUndefined(assignment)) {
                result.assignments.push(assignment);
              }

              callback();

            }, function (err) {

              callback(error, result);

            });

          }
        )
        ;
      }
    ], function (err, result) {
      cb(err, result);
    });

  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('weka', [], function () {
      return weka;
    });
  }
}).call(this);