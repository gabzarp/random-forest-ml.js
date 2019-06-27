'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var Random = _interopDefault(require('random-js'));
var Matrix = require('ml-matrix');
var Matrix__default = _interopDefault(Matrix);
var mlCart = require('ml-cart');
var arrayMean = _interopDefault(require('ml-array-mean'));
var arrayMedian = _interopDefault(require('ml-array-median'));

function checkFloat(n) {
  return n > 0.0 && n <= 1.0;
}

/**
 * Select n with replacement elements on the training set and values, where n is the size of the training set.
 * @ignore
 * @param {Matrix} trainingSet
 * @param {Array} trainingValue
 * @param {number} seed - seed for the random selection, must be a 32-bit integer.
 * @return {object} with new X and y.
 */
function examplesBaggingWithReplacement(trainingSet, trainingValue, seed) {
  var engine = Random.engines.mt19937();
  var distribution = Random.integer(0, trainingSet.rows - 1);
  if (seed === undefined) {
    engine = engine.autoSeed();
  } else if (Number.isInteger(seed)) {
    engine = engine.seed(seed);
  } else {
    throw new RangeError(`Expected seed must be undefined or integer not ${seed}`);
  }

  var Xr = new Array(trainingSet.rows);
  var yr = new Array(trainingSet.rows);

  for (var i = 0; i < trainingSet.rows; ++i) {
    var index = distribution(engine);
    Xr[i] = trainingSet[index];
    yr[i] = trainingValue[index];
  }

  return {
    X: new Matrix__default(Xr),
    y: yr
  };
}

/**
 * selects n features from the training set with or without replacement, returns the new training set and the indexes used.
 * @ignore
 * @param {Matrix} trainingSet
 * @param {number} n - features.
 * @param {boolean} replacement
 * @param {number} seed - seed for the random selection, must be a 32-bit integer.
 * @return {object}
 */
function featureBagging(trainingSet, n, replacement, seed) {
  if (trainingSet.columns < n) {
    throw new RangeError('N should be less or equal to the number of columns of X');
  }

  var distribution = Random.integer(0, trainingSet.columns - 1);
  var engine = Random.engines.mt19937();
  if (seed === undefined) {
    engine = engine.autoSeed();
  } else if (Number.isInteger(seed)) {
    engine = engine.seed(seed);
  } else {
    throw new RangeError(`Expected seed must be undefined or integer not ${seed}`);
  }

  var toRet = new Matrix__default(trainingSet.rows, n);

  if (replacement) {
    var usedIndex = new Array(n);
    for (var i = 0; i < n; ++i) {
      var index = distribution(engine);
      usedIndex[i] = index;
      toRet.setColumn(i, trainingSet.getColumn(index));
    }
  } else {
    usedIndex = new Set();
    index = distribution(engine);
    for (i = 0; i < n; ++i) {
      while (usedIndex.has(index)) {
        index = distribution(engine);
      }
      toRet.setColumn(i, trainingSet.getColumn(index));
      usedIndex.add(index);
    }
    usedIndex = Array.from(usedIndex);
  }

  return {
    X: toRet,
    usedIndex: usedIndex
  };
}

/**
 * @class RandomForestBase
 */
class RandomForestBase {
  /**
   * Create a new base random forest for a classifier or regression model.
   * @constructor
   * @param {object} options
   * @param {number|String} [options.maxFeatures] - the number of features used on each estimator.
   *        * if is an integer it selects maxFeatures elements over the sample features.
   *        * if is a float between (0, 1), it takes the percentage of features.
   * @param {boolean} [options.replacement] - use replacement over the sample features.
   * @param {number} [options.seed] - seed for feature and samples selection, must be a 32-bit integer.
   * @param {number} [options.nEstimators] - number of estimator to use.
   * @param {object} [options.treeOptions] - options for the tree classifier, see [ml-cart]{@link https://mljs.github.io/decision-tree-cart/}
   * @param {boolean} [options.isClassifier] - boolean to check if is a classifier or regression model (used by subclasses).
   * @param {boolean} [options.useSampleBagging] - use bagging over training samples.
   * @param {object} model - for load purposes.
   */
  constructor(options, model) {
    if (options === true) {
      this.replacement = model.replacement;
      this.maxFeatures = model.maxFeatures;
      this.nEstimators = model.nEstimators;
      this.treeOptions = model.treeOptions;
      this.isClassifier = model.isClassifier;
      this.seed = model.seed;
      this.n = model.n;
      this.indexes = model.indexes;
      this.useSampleBagging = model.useSampleBagging;

      var Estimator = this.isClassifier ? mlCart.DecisionTreeClassifier : mlCart.DecisionTreeRegression;
      this.estimators = model.estimators.map((est) => Estimator.load(est));
    } else {
      this.replacement = options.replacement;
      this.maxFeatures = options.maxFeatures;
      this.nEstimators = options.nEstimators;
      this.treeOptions = options.treeOptions;
      this.isClassifier = options.isClassifier;
      this.seed = options.seed;
      this.useSampleBagging = options.useSampleBagging;
    }
  }

  /**
   * Train the decision tree with the given training set and labels.
   * @param {Matrix|Array} trainingSet
   * @param {Array} trainingValues
   */
  train(trainingSet, trainingValues) {
    trainingSet = Matrix.Matrix.checkMatrix(trainingSet);

    this.maxFeatures = this.maxFeatures || trainingSet.columns;

    if (checkFloat(this.maxFeatures)) {
      this.n = Math.floor(trainingSet.columns * this.maxFeatures);
    } else if (Number.isInteger(this.maxFeatures)) {
      if (this.maxFeatures > trainingSet.columns) {
        throw new RangeError(`The maxFeatures parameter should be less than ${trainingSet.columns}`);
      } else {
        this.n = this.maxFeatures;
      }
    } else {
      throw new RangeError(`Cannot process the maxFeatures parameter ${this.maxFeatures}`);
    }


    if (this.isClassifier) {
      var Estimator = mlCart.DecisionTreeClassifier;
    } else {
      Estimator = mlCart.DecisionTreeRegression;
    }

    this.estimators = new Array(this.nEstimators);
    this.indexes = new Array(this.nEstimators);

    for (var i = 0; i < this.nEstimators; ++i) {
      var res = this.useSampleBagging ? examplesBaggingWithReplacement(trainingSet, trainingValues, this.seed) : { X: trainingSet, y: trainingValues };
      var X = res.X;
      var y = res.y;

      res = featureBagging(X, this.n, this.replacement, this.seed);
      X = res.X;

      this.indexes[i] = res.usedIndex;
      this.estimators[i] = new Estimator(this.treeOptions);
      this.estimators[i].train(X, y);
    }
  }

  /**
   * Method that returns the way the algorithm generates the predictions, for example, in classification
   * you can return the mode of all predictions retrieved by the trees, or in case of regression you can
   * use the mean or the median.
   * @abstract
   * @param {Array} values - predictions of the estimators.
   * @return {number} prediction.
   */
  // eslint-disable-next-line no-unused-vars
  selection(values) {
    throw new Error('Abstract method \'selection\' not implemented!');
  }

  /**
   * Predicts the output given the matrix to predict.
   * @param {Matrix|Array} toPredict
   * @return {Array} predictions
   */
  predict(toPredict) {
    var predictionValues = new Array(this.nEstimators);
    toPredict = Matrix.Matrix.checkMatrix(toPredict);
    for (var i = 0; i < this.nEstimators; ++i) {
      var X = toPredict.columnSelectionView(this.indexes[i]); // get features for estimator
      predictionValues[i] = this.estimators[i].predict(X);
    }

    predictionValues = new Matrix.WrapperMatrix2D(predictionValues).transposeView();
    var predictions = new Array(predictionValues.rows);
    for (i = 0; i < predictionValues.rows; ++i) {
      predictions[i] = this.selection(predictionValues.getRow(i));
    }

    return predictions;
  }

  /**
   * Export the current model to JSON.
   * @return {object} - Current model.
   */
  toJSON() {
    return {
      indexes: this.indexes,
      n: this.n,
      replacement: this.replacement,
      maxFeatures: this.maxFeatures,
      nEstimators: this.nEstimators,
      treeOptions: this.treeOptions,
      isClassifier: this.isClassifier,
      seed: this.seed,
      estimators: this.estimators.map((est) => est.toJSON()),
      useSampleBagging: this.useSampleBagging
    };
  }
}

const defaultOptions = {
  maxFeatures: 1.0,
  replacement: true,
  nEstimators: 10,
  seed: 42,
  useSampleBagging: false
};

/**
 * @class RandomForestClassifier
 * @augments RandomForestBase
 */
class RandomForestClassifier extends RandomForestBase {
  /**
     * Create a new base random forest for a classifier or regression model.
     * @constructor
     * @param {object} options
     * @param {number} [options.maxFeatures=1.0] - the number of features used on each estimator.
     *        * if is an integer it selects maxFeatures elements over the sample features.
     *        * if is a float between (0, 1), it takes the percentage of features.
     * @param {boolean} [options.replacement=true] - use replacement over the sample features.
     * @param {number} [options.seed=42] - seed for feature and samples selection, must be a 32-bit integer.
     * @param {number} [options.nEstimators=10] - number of estimator to use.
     * @param {object} [options.treeOptions={}] - options for the tree classifier, see [ml-cart]{@link https://mljs.github.io/decision-tree-cart/}
     * @param {boolean} [options.useSampleBagging=false] - use bagging over training samples.
     * @param {object} model - for load purposes.
     */
  constructor(options, model) {
    if (options === true) {
      super(true, model.baseModel);
    } else {
      options = Object.assign({}, defaultOptions, options);
      options.isClassifier = true;
      super(options);
    }
  }

  /**
     * retrieve the prediction given the selection method.
     * @param {Array} values - predictions of the estimators.
     * @return {number} prediction
     */
  selection(values) {
    return mode(values);
  }

  /**
     * Export the current model to JSON.
     * @return {object} - Current model.
     */
  toJSON() {
    var baseModel = super.toJSON();
    return {
      baseModel: baseModel,
      name: 'RFClassifier'
    };
  }

  /**
     * Load a Decision tree classifier with the given model.
     * @param {object} model
     * @return {RandomForestClassifier}
     */
  static load(model) {
    if (model.name !== 'RFClassifier') {
      throw new RangeError(`Invalid model: ${model.name}`);
    }

    return new RandomForestClassifier(true, model);
  }
}

/**
 * Return the most repeated element on the array.
 * @param {Array} arr
 * @return {number} mode
 */
function mode(arr) {
  return arr.sort((a, b) =>
    arr.filter((v) => v === a).length
        - arr.filter((v) => v === b).length
  ).pop();
}

const selectionMethods = {
  mean: arrayMean,
  median: arrayMedian
};

const defaultOptions$1 = {
  maxFeatures: 1.0,
  replacement: false,
  nEstimators: 10,
  treeOptions: {},
  selectionMethod: 'mean',
  seed: 42,
  useSampleBagging: false
};

/**
 * @class RandomForestRegression
 * @augments RandomForestBase
 */
class RandomForestRegression extends RandomForestBase {
  /**
     * Create a new base random forest for a classifier or regression model.
     * @constructor
     * @param {object} options
     * @param {number} [options.maxFeatures=1.0] - the number of features used on each estimator.
     *        * if is an integer it selects maxFeatures elements over the sample features.
     *        * if is a float between (0, 1), it takes the percentage of features.
     * @param {boolean} [options.replacement=true] - use replacement over the sample features.
     * @param {number} [options.seed=42] - seed for feature and samples selection, must be a 32-bit integer.
     * @param {number} [options.nEstimators=10] - number of estimator to use.
     * @param {object} [options.treeOptions={}] - options for the tree classifier, see [ml-cart]{@link https://mljs.github.io/decision-tree-cart/}
     * @param {string} [options.selectionMethod="mean"] - the way to calculate the prediction from estimators, "mean" and "median" are supported.
     * @param {boolean} [options.useSampleBagging=false] - use bagging over training samples.
     * @param {object} model - for load purposes.
     */
  constructor(options, model) {
    if (options === true) {
      super(true, model.baseModel);
      this.selectionMethod = model.selectionMethod;
    } else {
      options = Object.assign({}, defaultOptions$1, options);

      if (!(options.selectionMethod === 'mean' || options.selectionMethod === 'median')) {
        throw new RangeError(`Unsupported selection method ${options.selectionMethod}`);
      }

      options.isClassifier = false;

      super(options);
      this.selectionMethod = options.selectionMethod;
    }
  }

  /**
     * retrieve the prediction given the selection method.
     * @param {Array} values - predictions of the estimators.
     * @return {number} prediction
     */
  selection(values) {
    return selectionMethods[this.selectionMethod](values);
  }

  /**
     * Export the current model to JSON.
     * @return {object} - Current model.
     */
  toJSON() {
    var baseModel = super.toJSON();
    return {
      baseModel: baseModel,
      selectionMethod: this.selectionMethod,
      name: 'RFRegression'
    };
  }

  /**
     * Load a Decision tree classifier with the given model.
     * @param {object} model
     * @return {RandomForestRegression}
     */
  static load(model) {
    if (model.name !== 'RFRegression') {
      throw new RangeError(`Invalid model: ${model.name}`);
    }

    return new RandomForestRegression(true, model);
  }
}

exports.RandomForestClassifier = RandomForestClassifier;
exports.RandomForestRegression = RandomForestRegression;
