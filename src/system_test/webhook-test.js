"use strict";
const expect = require('expect');
const request = require('request');

describe('Webhooks tests', () => {
  it('should handles GET request correctly', (done) => {
    const webhookUrl = process.env.WEBHOOK_URL;
    request.get(webhookUrl, (error, response, body) => {
      expect(!error && response.statusCode).toEqual(200);
      done();
    });
  });
  it('should handles POST request correctly', (done) => {
    const webhookUrl = process.env.WEBHOOK_URL;
    request.post(webhookUrl, (error, response, body) => {
      expect(!error && response.statusCode).toEqual(200);
      done();
    });
  });
});
