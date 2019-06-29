'use strict';

const Diagnosis = require("./Diagnosis");
const ConfusionMatrix = require('ml-confusion-matrix')
const rmcl = require('ml-random-forest');
var fs = require('fs');

module.exports = Classifier;

function Classifier(){
  this.diagnosis = new Diagnosis();
  this.model = JSON.parse(fs.readFileSync("./model.json"))
  this.options = {
    seed: 5,
    maxFeatures: 0.8,
    replacement: false,
    nEstimators: 100,
    useSampleBagging: true
  };  
}

Classifier.prototype.createModel = async function(file){
    await this.diagnosis.saveDataset(file)
    var trainingSet = this.diagnosis.getNumbers();
    
    var prediction = this.diagnosis.getClasses().map((elem) =>
    this.diagnosis.getDistinctClasses().indexOf(elem)
    );

  var classifier = new rmcl.RandomForestClassifier(this.options);
    classifier.train(trainingSet, prediction);

    fs.writeFile('model.json', JSON.stringify(classifier.toJSON()), (err) =>{
        if(err) throw err;
        console.log("Model saved")
        return;
    });
}
Classifier.prototype.getModel = function(){
  return this.model
}

Classifier.prototype.predict = function(data){
  var classifier = new rmcl.RandomForestClassifier(true, this.model);
  var predictions = classifier.predict([JSON.parse(data)])
  var distinctClasses = this.diagnosis.getDistinctClasses()

  return predictions.map( d => distinctClasses[d])
}