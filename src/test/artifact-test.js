"use strict";
const expect = require('expect');
const sinon = require('sinon');
const request = require('request');
const fs = require('fs');

const deployer = require('../deployer');

const BuildCompleteJSON = {
  object_kind: 'build',
  ref: 'master',
  tag: false,
  before_sha: 'sha',
  sha: 'sha',
  build_id: 376,
  build_name: 'pages',
  build_stage: 'deploy',
  build_status: 'success',
  build_started_at: '2016-07-13 14:00:30 +0000',
  build_finished_at: '2016-07-13 14:01:58 +0000',
  build_duration: 87.9268166,
  build_allow_failure: false,
  project_id: 105,
  project_name: 'username / plain-html',
  user: { id: 13, name: 'username', email: 'username@gmail.com' },
  commit:
   { id: 1048,
     sha: 'sha',
     message: 'Add new file',
     author_name: 'username',
     author_email: 'username@gmail.com',
     status: 'success',
     duration: 87,
     started_at: '2016-07-13 14:00:30 +0000',
     finished_at: '2016-07-13 14:01:58 +0000' },
  repository:
   { name: 'plain-html',
     url: 'ssh://git@gitlab.example.com/groupname/plain-html.git',
     description: '',
     homepage: 'https://gitlab.example.com/groupname/plain-html',
     git_http_url: 'https://gitlab.example.com/groupname/plain-html.git',
     git_ssh_url: 'ssh://git@gitlab.example.com/groupname/plain-html.git',
     visibility_level: 10 } }

describe('Artifact tests', () => {
  let sandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());
  it('should download artifact after receiving build complete notification', (done) => {
    const fileReadStream = fs.createReadStream('test/artifacts.zip');
    sandbox.stub(request, 'get').returns(fileReadStream);
    deployer.deploy(BuildCompleteJSON);
    setTimeout(() => {
      fs.stat('public/groupname/plain-html/index.html', (err, stats) => {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
    }, 1000);
  });
  it('should not crash when no such a {PROJECT_ROOT} directory', (done) => {
    const fileReadStream = fs.createReadStream('test/artifacts-no-public-directory.zip');
    sandbox.stub(request, 'get').returns(fileReadStream);
    deployer.deploy(BuildCompleteJSON);
    setTimeout(() => {
        done();
    }, 1000);
  });
  it('should not crash when private token is not provided', (done) => {
    const wrongPrivateTokenReturn = {"message":"401 Unauthorized"};
    sandbox.stub(request, 'get').yields(null, {statusCode: 401}, wrongPrivateTokenReturn).returns({pipe: () => {}});
    deployer.deploy(BuildCompleteJSON);
    setTimeout(() => {
        done();
    }, 1000);
  });
  it('should not crash when levels of {PROJECT_ROOT} is more than one', (done) => {
    const wrongPrivateTokenReturn = {"message":"401 Unauthorized"};
    delete require.cache[require.resolve('../deployer')]
    sandbox.stub(process.env, 'PROJECT_ROOT', 'public/public');
    const deployer = require('../deployer');
    const fileReadStream = fs.createReadStream('test/artifacts-two-level-public.zip');
    sandbox.stub(request, 'get').returns(fileReadStream);
    deployer.deploy(BuildCompleteJSON);
    setTimeout(() => {
      fs.stat('public/groupname/plain-html/index.html', (err, stats) => {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
    }, 1000);
  });
});
