"use strict";
const request = require('request');
const path = require('path');
const expect = require('expect');
const fs = require('fs');
const mkdirp = require('mkdirp');

describe('CNAME tests', () => {
  it('should support CNAME customization', () => {
    // TODO: clean file changes
    const port = process.env.GITLAB_CE_PAGES_PORT || '80';
    const publicVolume = process.env.GITLAB_CE_PAGES_PUBLIC_VOLUME;
    const cnameVolume = process.env.GITLAB_CE_PAGES_CNAME_VOLUME;
    const project1Dir = path.join(publicVolume, 'groupname/project1');
    const project2Dir = path.join(publicVolume, 'groupname/project2');
    const cnamePath = path.join(cnameVolume, 'cname.txt');
    return new Promise((resolve, reject) => {
      return Promise.resolve().then(() => {
        console.log('mkdir for project1');
        return new Promise((resolve, reject) => {
          mkdirp(project1Dir, (err) => {
            expect(err).toNotExist();
            resolve();
          });
        });
      }).then(() => {
        console.log('mkdir for project2');
        return new Promise((resolve, reject) => {
          mkdirp(project2Dir, (err) => {
            expect(err).toNotExist();
            resolve();
          });
        });
      }).then(() => {
        fs.writeFileSync(path.join(project1Dir, 'index.html'), 'project1');
        fs.writeFileSync(path.join(project2Dir, 'index.html'), 'project2');
        console.log('directing example domains to project1');
        // I have no idea why this \n changes things.
        // You can't leave without it or nothing read out from generate_sites.sh
        fs.writeFileSync(cnamePath, 'groupname/project1 example1.com example2.com\n');
      }).then(() => {
        console.log('waiting for CNAME to reload');
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve();
          }, 500);
        });
      }).then(() => {
        console.log('requesting example1.com');
        return new Promise((resolve, reject) => {
          request.get({
            url: 'http://127.0.0.1' + (port == '80' ? '' : ':' + port),
            headers: {
              host: 'example1.com'
            }
          }, (error, response, body) => {
            expect(error).toNotExist();
            expect(body).toEqual('project1');
            resolve();
          });
        });
      }).then(() => {
        console.log('directing example domains to project2');
        // I have no idea why this \n changes things.
        // You can't leave without it or nothing read out from generate_sites.sh
        fs.writeFileSync(cnamePath, 'groupname/project2 example2.com\n');
      }).then(() => {
        console.log('waiting for CNAME to reload');
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve();
          }, 500);
        });
      }).then(() => {
        console.log('requesting example2.com');
        return new Promise((resolve, reject) => {
          request.get({
            url: 'http://127.0.0.1' + (port == '80' ? '' : ':' + port),
            headers: {
              host: 'example2.com'
            }
          }, (error, response, body) => {
            expect(error).toNotExist();
            expect(body).toEqual('project2');
            resolve();
          });
        });
      }).then(() => {
        console.log('cleaning contents in cname.txt');
        // I have no idea why this \n changes things.
        // You can't leave without it or nothing read out from generate_sites.sh
        fs.writeFileSync(cnamePath, '');
      }).then(() => {
        console.log('waiting for CNAME to reload');
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve();
          }, 500);
        });
      }).then(() => {
        console.log('requesting unassigned example2.com');
        return new Promise((resolve, reject) => {
          request.get({
            url: 'http://127.0.0.1' + (port == '80' ? '' : ':' + port),
            headers: {
              host: 'example2.com'
            }
          }, (error, response, body) => {
            expect(error).toNotExist();
            expect(body).toEqual('Hi!');
            resolve();
          });
        });
      }).then(() => {
        resolve();
      }).catch((err) => {
        reject(err);
      });
    });
  }).timeout(5000);
});
