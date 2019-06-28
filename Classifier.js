'use strict';

const Diagnosis = require("./Diagnosis");
const ConfusionMatrix = require('ml-confusion-matrix')
const RandomForestClassifier = require('ml-random-forest');
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

Classifier.prototype.createModel = function(file){
    this.diagnosis.saveDataset(file)
    var trainingSet = this.diagnosis.getNumbers();
    
    var prediction = this.diagnosis.getClasses().map((elem) =>
    this.diagnosis.getDistinctClasses().indexOf(elem)
    );
    console.log(prediction);
    console.log(trainingSet);
    var classifier = new RandomForestClassifier.RandomForestClassifier(this.options);
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
  console.log(data)
  console.log(JSON.parse(data))
  var classifier = new RandomForestClassifier.RandomForestClassifier(this.options);
  return classifier.predict([JSON.parse(data)])
}