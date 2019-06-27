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

var weka = require('./lib/weka-lib.js');
var arff = require('node-arff');
var _ = require('underscore');

//Filter Test
//child = exec('weka weka.filters.unsupervised.attribute.PrincipalComponents -i ./test/test.arff -o ./test/result.arff', function (error, stdout, stderr) {
//  sys.print('stdout: ' + stdout);
//  sys.print('stderr: ' + stderr);
//  if (error !== null) {
//    console.log('exec error: ' + error);
//  }
//});

//Sample classification with SVM
function sampleClassification(file, classifier, cb) {
  arff.load(file, function (err, data) {

    if (!_.isNull(err)) {
      cb(err);
      return;
    }

    //See Weka Documentation for classifiers
    var options = {
      'classifier': classifier,
      'params'    : ''
    };

    var testData = {
      outlook    : 'overcast',
      temperature: 30,
      humidity   : 2,
      windy      : 'TRUE',
      play       : 'no'
    };

    weka.classify(data, testData, options, function (err, result) {
      cb(err, result);
    });
  });
}

//Sample clustering with EM
function sampleClustering(cb) {
  arff.load('./test/glass.arff', function (err, data) {

    if (!_.isNull(err)) {
      cb(err);
      return;
    }

    //See Weka Documentation
    var options = {
      'clusterer': 'weka.clusterers.EM',
      'params'   : ''
    };

    weka.cluster(data, options, function (err, result) {
      cb(err, result);
    });

  });
}

//Sample factor analysis
function sampleFactorAnalysis(cb) {
  arff.load('./test/glass.arff', function (err, data) {

    if (!_.isNull(err)) {
      cb(err);
      return;
    }

    //See Weka Documentation
    var options = {
      'evaluator': 'weka.attributeSelection.PrincipalComponents',
      'e_params' : '-R 0.95 -A 5',
      'ranker'   : 'weka.attributeSelection.Ranker',
      'r_params' : ''
    };

    weka.correlationMatrix(data, options, function (err, result) {
      cb(err, result);
    });

  });
}

var vows = require('vows'),
    assert = require('assert'),
    async = require('async');

// Create a Test Suite
vows.describe('Test Weka Module').addBatch({

  'running weka.classifiers.functions.notExistent on ./test/training.arff': {

    topic: function () {

      var outerCb = this.callback;

      async.waterfall([
        function (callback) {
          sampleClassification('./test/training.arff', 'weka.classifiers.functions.notExistent', callback);
        }
      ], function (err, result) {
        outerCb(err, result);
      });

    },

    'we detect an handled error': function (err, stat) {
      assert.isNotNull(err);
      assert.isUndefined(stat);
    }

  },

  'running weka.classifiers.functions.SMO on ./test/training.arff': {

    topic: function () {

      var outerCb = this.callback;

      async.waterfall([
        function (callback) {
          sampleClassification('./test/training.arff', 'weka.classifiers.functions.SMO', callback);
        }
      ], function (err, result) {
        outerCb(err, result);
      });

    },

    'we got no error': function (err, stat) {
      assert.isNull(err);
    },

    'we got { predicted: "yes", prediction: "1" } as result': function (err, stat) {
      assert.equal(stat.predicted, 'yes');
      assert.equal(stat.prediction, 1);
    }
  },

  'running weka.clusterers.EM on ./test/glass.arff': {

    topic: function () {

      var outerCb = this.callback;

      async.waterfall([
        function (callback) {
          sampleClustering(callback);
        }
      ], function (err, result) {
        outerCb(err, result);
      });

    },

    'we got no error': function (err, stat) {
      assert.isNull(err);
    },

    'we got the same content as in "./test/test.json" as result': function (err, stat) {
      var fileJSON = require('./test/test.json');
      assert.deepEqual(fileJSON.assignments, stat.assignments);
    }
  },

  'running weka.attributeSelection.PrincipalComponents -R 0.95 -A 5 -s "weka.attributeSelection.Ranker" on ./test/glass.arff': {

    topic: function () {

      var outerCb = this.callback;

      async.waterfall([
        function (callback) {
          sampleFactorAnalysis(callback);
        }
      ], function (err, result) {
        outerCb(err, result);
      });

    },

    'we got no error': function (err, stat) {
      assert.isNull(err);
    },

    'we got the same content as in "./test/test.json" as result': function (err, stat) {
      var fileJSON = require('./test/test.json');
      assert.deepEqual(fileJSON.correlation, stat.correlation);
    }
  }

}).export(module); // Export the Suite