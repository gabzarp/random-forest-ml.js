'use strict';

const assert = require('assert');

const iris = require('.');

var dataset = iris.getDataset();
assert.strictEqual(dataset.length, 150);
assert.deepStrictEqual(dataset[0], [5.1,3.5,1.4,0.2,"setosa"]);

var numbers = iris.getNumbers();
assert.strictEqual(numbers.length, 150);
assert.deepStrictEqual(numbers[0], [5.1,3.5,1.4,0.2]);

var classes = iris.getClasses();
assert.strictEqual(classes.length, 150);
assert.strictEqual(classes[0], 'setosa');

var distinctClasses = iris.getDistinctClasses();
assert.deepStrictEqual(distinctClasses, ['setosa', 'versicolor', 'virginica']);
