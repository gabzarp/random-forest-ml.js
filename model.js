'use strict';

const Diagnosis = require("./diagnosis");
const ConfusionMatrix = require('ml-confusion-matrix')
const RandomForestClassifier = require('ml-random-forest');
var fs = require('fs');

exports.createModel = function(file){
    var diagnosis = new Diagnosis();
    diagnosis.saveDataset(file)
    var trainingSet = diagnosis.getNumbers();
    
    var prediction = diagnosis.getClasses().map((elem) =>
    diagnosis.getDistinctClasses().indexOf(elem)
    );
    var options = {
      seed: 5,
      maxFeatures: 0.8,
      replacement: false,
      nEstimators: 100,
      useSampleBagging: true
    };  
    var classifier = new RandomForestClassifier.RandomForestClassifier(options);
    classifier.train(trainingSet, prediction);
    fs.writeFile('model.json', classifier.toJSON, (err) =>{
        if(err) throw err;
        console.log("Model saved")
        return;
    });
}