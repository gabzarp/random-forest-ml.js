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
  createModel: async (ctx) => {
    ctx.body = await clsf.createModel(ctx.request.files.file)
  }
}
const classifier = {
  predict: (ctx) => {
    ctx.body = clsf.predict(ctx.request.header.data)
  }
}

app.use(_.post('/model', model.createModel))
  .use(_.get('/predict', classifier.predict))

app.listen(3000);