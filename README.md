# random-forest-ml.js
To run project: node app.js
# API Reference
1. Create model from dataset
* Endpoint: /model 
* Request: POST 
* Request body: 
```
{ 
  file : * Your JSON array training data set*
}
JSON array training data set example: [ [1, 0, 1, 'yes', 'no'] ]
Obs. The last column of the array must be your desired classification and it is restricted to two values
```
* Response body:
```
{
    "Accuracy": *The accuracy of the model*,
    "True value": *The value that should be considered true for the sensitivity and specificity*,
    "Sensitivity": *The accuracy of the true value*,
    "Specificity": *The accuracy of the false value*
}
```
2. Predict
* Endpoint: /predict
* Request: GET
* Params: 
```
{
  data: *Array that you want to predict*
}
Prediction Array exemple [ [1, 0, 1, 'yes'], [0, 1, 0, 'no'] ]
```
* Response: 
```
[ *Predict of array 1*, *Predict of array 2*, ...]
Responde example: ['yes', 'no']
Obs. Your response will return in the model classification syntax
```
