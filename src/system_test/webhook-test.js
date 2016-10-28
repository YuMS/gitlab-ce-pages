"use strict";
const expect = require('expect');
const request = require('request');
const webhookUrl = process.env.WEBHOOK_URL;

describe('Webhooks tests', () => {
  it('should handles GET request correctly', (done) => {
    request.get(webhookUrl, (error, response, body) => {
      expect(!error && response.statusCode).toEqual(200);
      done();
    });
  });
  it('should handles POST request correctly', (done) => {
    request.post(webhookUrl, (error, response, body) => {
      expect(!error && response.statusCode).toEqual(200);
      done();
    });
  });
});
