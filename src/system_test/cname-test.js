"use strict";
const expect = require('expect');
const request = require('request');
const execSync = require('child_process').execSync;
const path = require('path');
const fs = require('fs');

describe('CNAME tests', () => {
  it('should support CNAME customization', (done) => {
    // TODO: clean these file changes
    const port = process.env.GITLAB_CE_PAGES_PORT || '80';
    const publicVolume = process.env.GITLAB_CE_PAGES_PUBLIC_VOLUME;
    const cnameVolume = process.env.GITLAB_CE_PAGES_CNAME_VOLUME;
    fs.writeFileSync(path.join(publicVolume, 'groupname/project1', 'index.html'), 'hello1!');
    fs.writeFileSync(path.join(publicVolume, 'groupname/project2', 'index.html'), 'hello2!');
    fs.writeFileSync(path.join(cnameVolume, 'cname.txt'), 'example1.com example2.com groupname/project1');
    setTimeout(() => {
      request.get('http://example1.com' + (port == '80' ? '' : ':' + port), (error, response, body) => {
        expect(!error && body).toEqual('hello1!');
        fs.writeFileSync(path.join(cnameVolume, 'cname.txt'), 'example1.com example2.com groupname/project2');
        setTimeout(() => {
          request.get('http://example2.com' + (port == '80' ? '' : ':' + port), (error, response, body) => {
            expect(!error && body).toEqual('hello2!');
            fs.unlinkSync(path.join(cnameVolume, 'cname.txt'));
            setTimeout(() => {
              request.get('http://example1.com' + (port == '80' ? '' : ':' + port), (error, response, body) => {
                expect(error && response.statusCode).toEqual(404);
                done();
              });
            }, 1000);
          });
        }, 1000);
      });
    }, 1000);
  });
});
