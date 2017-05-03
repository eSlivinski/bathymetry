const express = require('express');
const http = require('http');
const logger = require('morgan');
const fs = require('fs');
const jsLog = require('log4js').getLogger('main_server');
const domain = require('domain').create();


domain.on('error', (err) => {
  jsLog.error('Domain error - worthy of a server crash: ');
  jsLog.error(err.stack);
});

domain.run(() => {
  let app = express();
  let server = http.Server(app);
  let port = process.env.PORT || 3000;

  app.use(logger('dev'));

  // include all controllers
  fs.readdirSync(__dirname + '/api/').forEach((file)=> {
    if (file.substr(-3) !== '.js') {
      let lib = require(__dirname + '/api/' + file);
      if (lib.attachHandlers){
        lib.attachHandlers(app);
      }
    }
  });

  app.use((err, req, res, next) => {
    if (err) {
      jsLog.error(err);
      res.status(500).json(err);
    } else {
      res.status(500).json('Unknown');
    }
  });

  app.use((req, res, next) => {
    res.status(404).json('Page not found');
  });

  server.listen(port, () => {
    jsLog.info("Listening on " + port);
  });

});
