"use strict";
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const deployer = require('./deployer');

const app = express();

const port = process.env.PORT || 3000;
const relativeUrl = '/' + (process.env.RELATIVE_URL || '');

app.use(bodyParser.json());

app.get(relativeUrl, (req, res) => {
  // TODO: show pages table
  res.send('Hi!');
});

app.post(relativeUrl, (req, res) => {
  var body = req.body;
  if (!body) {
    res.send('empty body');
    return;
  }
  if (body.build_name !== 'pages') {
    console.log('Only care about builds with name `pages`');
    res.send('Only care about builds with name `pages`');
    return;
  }
  if (body.build_status !== 'success') {
    console.log('Only care about succeed builds');
    res.send('Only care about succeed builds');
    return;
  }
  deployer.deploy(body);
  res.send('OK');
});

app.listen(port, () => {
  console.log('webhook listener listening on ' + port);
});
