const Koa = require('koa');
const app = new Koa();
const Model = require('./model')
const _ = require('koa-route')
const bodyParser = require('koa-body')
const logger = require('koa-logger');

app.use(logger());
app.use(bodyParser({multipart: true}))

const model = {
  createModel: (ctx) => {
    Model.createModel(ctx.request.files.file)
    ctx.body = "Dataset Saved"
  }
}
const classifier = {
  
}

app.use(_.post('/model', model.createModel))

// app.use(async ctx => {
    
//     var trainingSet = diagnosis.getNumbers();
//     var prediction = diagnosis.getClasses().map((elem) =>
//         diagnosis.getDistinctClasses().indexOf(elem)
//     );
//     var options = {
//       seed: 5,
//       maxFeatures: 0.8,
//       replacement: false,
//       nEstimators: 100,
//       useSampleBagging: true
//     };

//     var classifier = new RandomForestClassifier.RandomForestClassifier(options);
//     classifier.train(trainingSet, prediction);
//     var result = classifier.predict(trainingSet);
//     const CM = ConfusionMatrix.fromLabels(prediction, result);
//     console.log(CM.getConfusionTable(1));
//     console.log(CM.getAccuracy());
//     ctx.body = result;

// });

app.listen(3000);