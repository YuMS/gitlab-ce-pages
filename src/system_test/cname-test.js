"use strict";
const expect = require('expect');
const request = require('request');
const execSync = require('child_process').execSync;
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');

describe('CNAME tests', () => {
  it('should support CNAME customization', (done) => {
    // TODO: clean these file changes
    // TODO: use promise
    const port = process.env.GITLAB_CE_PAGES_PORT || '80';
    const publicVolume = process.env.GITLAB_CE_PAGES_PUBLIC_VOLUME;
    const cnameVolume = process.env.GITLAB_CE_PAGES_CNAME_VOLUME;
    const project1Dir = path.join(publicVolume, 'groupname/project1');
    const project2Dir = path.join(publicVolume, 'groupname/project2');
    mkdirp(project1Dir, (err) => {
      if (err) {
        console.log('mkdir', project1Dir, 'failed');
        return;
      }
      mkdirp(project2Dir, (err) => {
        if (err) {
          console.log('mkdir', project2Dir, 'failed');
          return;
        }
        fs.writeFileSync(path.join(project1Dir, 'index.html'), 'hello1!');
        fs.writeFileSync(path.join(project2Dir, 'index.html'), 'hello2!');
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
  });
});
