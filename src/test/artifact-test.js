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

const buildsList = [{
  "artifacts_file": {
    "filename": "artifacts.zip",
    "size": 1786
  },
  "commit": {
    "author_email": "username@gmail.com",
    "author_name": "username",
    "created_at": "2016-08-08T09:03:24.000+08:00",
    "id": "b7d22330686e7061cc39624e4be309664616f49e",
    "message": "Add new file",
    "short_id": "b7d22330",
    "title": "Add new file"
  },
  "coverage": null,
  "created_at": "2016-09-05T21:15:57.077+08:00",
  "finished_at": "2016-09-05T21:19:45.617+08:00",
  "id": 376,
  "name": "pages",
  "ref": "master",
  "runner": {
    "active": true,
    "description": "runner",
    "id": 1,
    "is_shared": true,
    "name": "gitlab-ci-multi-runner"
  },
  "stage": "deploy",
  "started_at": "2016-09-05T21:15:58.130+08:00",
  "status": "success",
  "tag": false,
  "user": {
    "avatar_url": "",
    "bio": "",
    "created_at": "2016-02-23T17:22:14.355+08:00",
    "id": 10,
    "is_admin": true,
    "linkedin": "",
    "location": "",
    "name": "username",
    "skype": "",
    "state": "active",
    "twitter": "",
    "username": "username",
    "web_url": "https://gitlab.example.com/u/username",
    "website_url": ""
  }
}];
const delay = time => () => new Promise((resolve) => {
  setTimeout(resolve, time);
});
// This stub will firstly return build list for trigger validation
// and return artifacts.zip next
const stub_build_artifact = (sandbox, artifactReadStream) => {
  const stub = sandbox.stub(request, 'get');
  stub.onCall(1).returns(artifactReadStream);
  stub.yields(null, null, JSON.stringify(buildsList));
}

describe('Artifact tests', () => {
  let sandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());
  it('should download artifact after receiving build complete notification', (done) => {
    const fileReadStream = fs.createReadStream('test/artifacts.zip');
    stub_build_artifact(sandbox, fileReadStream);
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
  it('should renew site content after receiving another build complete notification', () => {
    const fileReadStream = fs.createReadStream('test/artifacts.zip');
    stub_build_artifact(sandbox, fileReadStream);
    deployer.deploy(BuildCompleteJSON);
    return new Promise((resolve, reject) => {
      return Promise.resolve()
      .then(delay(1000))
      .then(() => {
        const fileReadStream1 = fs.createReadStream('test/artifacts-index-htm.zip');
        sandbox.restore();
        stub_build_artifact(sandbox, fileReadStream1);
        deployer.deploy(BuildCompleteJSON);
      })
      .then(delay(1000))
      .then(() => {
        return new Promise((resolve, reject) => {
          fs.stat('public/groupname/plain-html/index.html', (err, stats) => {
            if (err) {
              fs.stat('public/groupname/plain-html/index.htm', (err, stats) => {
                if (err) {
                  reject(new Error('index.htm should be there'));
                } else {
                  resolve();
                }
              });
            } else {
              reject(new Error('index.html should have gone'));
            }
          });
        });
      })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
    })
  }).timeout(10000);
  it('should not crash when no such a {PROJECT_ROOT} directory', (done) => {
    const fileReadStream = fs.createReadStream('test/artifacts-no-public-directory.zip');
    stub_build_artifact(sandbox, fileReadStream);
    deployer.deploy(BuildCompleteJSON);
    setTimeout(() => {
        done();
    }, 1000);
  });
  it('should not crash when private token is wrong/not provided', (done) => {
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
    stub_build_artifact(sandbox, fileReadStream);
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
  it('should not renew site content if build is not latest', () => {
    const fileReadStream = fs.createReadStream('test/artifacts.zip');
    stub_build_artifact(sandbox, fileReadStream);
    deployer.deploy(BuildCompleteJSON);
    return new Promise((resolve, reject) => {
      return Promise.resolve()
      .then(delay(1000))
      .then(() => {
        const fileReadStream1 = fs.createReadStream('test/artifacts-index-htm.zip');
        sandbox.restore();
        stub_build_artifact(sandbox, fileReadStream1);
        deployer.deploy(Object.assign({}, BuildCompleteJSON, {
          build_id: 350
        }));
      })
      .then(delay(1000))
      .then(() => {
        return new Promise((resolve, reject) => {
          fs.stat('public/groupname/plain-html/index.htm', (err, stats) => {
            if (err) {
              fs.stat('public/groupname/plain-html/index.html', (err, stats) => {
                if (err) {
                  reject(new Error('index.html should remain there'));
                } else {
                  resolve();
                }
              });
            } else {
              reject(new Error('index.htm shouldn\'t be there'));
            }
          });
        });
      })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
    })
  }).timeout(10000);
  it('should not make damage when receives groupname=.. and projectname=.. even if artifacts.zip is received', () => {
    const fileReadStream = fs.createReadStream('test/artifacts.zip');
    stub_build_artifact(sandbox, fileReadStream);
    deployer.deploy(Object.assign({}, BuildCompleteJSON, {
      repository: Object.assign({}, BuildCompleteJSON.repository, {
        homepage: 'https://gitlab.example.com/../..'
      })
    }));
    return new Promise((resolve, reject) => {
      return Promise.resolve()
      .then(delay(1000))
      .then(() => {
        const fileReadStream1 = fs.createReadStream('test/artifacts.zip');
        sandbox.restore();
        stub_build_artifact(sandbox, fileReadStream1);
        deployer.deploy(BuildCompleteJSON);
      })
      .then(delay(1000))
      .then(() => {
        return new Promise((resolve, reject) => {
          fs.stat('public/groupname/plain-html/index.html', (err, stats) => {
            if (err) {
              reject(new Error('index.html should be there'));
            } else {
              resolve();
            }
          });
        });
      })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
    })
  }).timeout(10000);
});
