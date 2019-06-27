'use strict';

const dataset = require('./iris.json');

exports.getDataset = function () {
    return dataset.slice();
};

exports.getNumbers = function () {
    return dataset.map(d => d.slice(0, 4));
};

exports.getClasses = function () {
    return dataset.map(d => d[4]);
};

exports.getDistinctClasses = function () {
    return ['setosa', 'versicolor', 'virginica'];
};
