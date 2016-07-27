import * as express from 'express';
import * as bodyParser from 'body-parser';
import { Promise } from 'es6-promise';

import { Firebase } from './firebase';
import { Request } from './request';
import { Compilers, langIsSupported } from './supported-compilers';
import { HttpStatusCodes } from './http-status-codes';
import { InvalidRequestError, LanguageUnsupportedError } from './errors';

const Port = 8080;

let app = express();
let jsonParser = bodyParser.json();

// Allow CORS (Cross-Origin Resource Sharing)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  if ('OPTIONS' === req.method) {
    res.sendStatus(HttpStatusCodes.Success);
  } else {
    next();
  }
});

// var DockerCompiler = require('./docker-compiler');

/**
 * See documentation on usage here:
 * https://github.com/Tahler/capstone-api/README.md
 */
app.post('/api', jsonParser, (req, res) => {
  let request = req.body;
  if (Request.hasRequiredProperties(request)) {
    let lang = request.lang;
    if (langIsSupported(request.lang)) {
      handleRequest(request, res);
    } else {
      res.status(400).send(new LanguageUnsupportedError(lang));
    }
  } else {
    res.status(400).send(new InvalidRequestError(request));
  }
    // function runInDocker() {
    //   var dockerCompiler = new DockerCompiler(lang, code, seconds, tests);
    //   dockerCompiler.run(function (result) {
    //     res.status(200).send(result);
    //   });
    // }
});

function handleRequest(request: Request, res: express.Response) {
  let lang = request.lang;
  let src = request.src;
  let problemId = request.problem;
  // Load the timeout and test cases asynchronously
  let timeout, tests;
  Promise.all([
    Firebase.get(`/problems/${problemId}/timeout`),
    Firebase.get(`/tests/${problemId}`)
  ]).then(
    values => {
      timeout = values[0];
      tests = values[1];
      res.status(HttpStatusCodes.Success).send(`timeout: ${timeout}, tests: ${tests}`);
      // TODO: continue onto docker!
    },
    err => {
      console.error(err);
      res.status(HttpStatusCodes.ServerError).send({
        message: 'The server ran into an unexpected error.'
      });
    }
  );
}

app.listen(Port, () => console.log(`Listening on port ${Port}`));

export let App = app;
