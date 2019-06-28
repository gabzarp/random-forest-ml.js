const Koa = require('koa');
const app = new Koa();
const Classifier = require('./classifier')
const clsf = new Classifier();
const _ = require('koa-route')
const bodyParser = require('koa-body')
const logger = require('koa-logger');

app.use(logger());
app.use(bodyParser({multipart: true}))

const model = {
  createModel: (ctx) => {
    clsf.createModel(ctx.request.files.file)
    ctx.body = "Dataset Saved"
  }
}
const classifier = {
  predict: (ctx) => {
    console.log(ctx.request.header)
    ctx.body = clsf.predict(ctx.request.header.data)
  }
}

app.use(_.post('/model', model.createModel))
  .use(_.get('/predict', classifier.predict))

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