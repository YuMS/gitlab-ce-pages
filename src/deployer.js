"use strict";
const fs = require('fs');
const os = require('os');
const url = require('url');
const path = require('path');
const request = require('request');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');

const exec = require('child_process').exec;

const publicDir = process.env.GITLAB_CE_PAGES_PUBLIC_DIR;
const privateToken = process.env.PAGE_PRIVATE_TOKEN;
const projectRoot = process.env.PROJECT_ROOT;

let gitlabUrl = process.env.GITLAB_URL || 'localhost';
gitlabUrl = gitlabUrl.replace(/\/*$/, '/');

function extract(artifactName, artifactPath, tempDestination, destination) {
  exec('unzip ' + artifactPath + ' -d ' + tempDestination, (err, stdout, stderr) => {
    if (err) {
      console.error('unzip', artifactName, 'failed');
      console.error(err);
      rimraf(tempDestination, () => {
        console.log('tempDestination', tempDestination, 'removed');
      });
    } else {
      console.log('unzipped', artifactName, 'into', tempDestination);
      console.log('removing artifact', artifactPath);
      // Artifact is expected to run parallel with moving files down below
      exec('rm ' + artifactPath,
        (err, stdout, stderr) => {
          if (err) {
            console.error('artifact removal', artifactPath, 'failed');
            console.error(err);
          } else {
            console.log('artifact removal', artifactPath, 'succeed');
          }
        }
      );
      rimraf(destination, () => {
        exec('mv ' + tempDestination + ' ' + destination,
          (err, stdout, stderr) => {
            if (err) {
              console.error('Moving from tempDestination', tempDestination, 'to destination', destination, 'failed');
              console.error(err);
            } else {
              if (projectRoot) {
                console.log('moving files out of', projectRoot);
                exec('cd ' + destination + ' && mv ' + projectRoot + ' PROJECT_ROOT && cd PROJECT_ROOT && mv ./* .. && cd .. && rm -rf PROJECT_ROOT',
                  (err, stdout, stderr) => {
                    if (err) {
                      console.error('files moving out of', projectRoot, 'failed');
                      console.error(err);
                    } else {
                      console.log('files moving out of', projectRoot, 'succeed');
                    }
                  }
                );
              }
            }
          }
        );
      });
    }
  });
}

function update(body, pageDir) {
  if (!privateToken) {
    console.log('missing private token');
    return;
  }
  mkdirp(pageDir, (err) => {
    if (err) {
      console.log('mkdir', pageDir, 'failed');
      return;
    }
    const pid = body.project_id;
    const bid = body.build_id;
    const options = {
      url: url.resolve(gitlabUrl, 'api/v3/projects/' + pid + '/builds/' + bid + '/artifacts'),
      headers: {
        'PRIVATE-TOKEN': privateToken
      }
    }
    console.log('options', options);
    const artifactName = bid + '.zip';
    const artifactPath = path.join(publicDir, artifactName);
    const artifactWriteStream = fs.createWriteStream(artifactPath);
    artifactWriteStream.on('close', (err) => {
      if (err) {
        console.log('download', artifactName, 'failed');
        return;
      }
      console.log(artifactName, 'downloaded');
      const tempDestination = path.join(os.tmpdir(), 'temp', Math.random().toString().substr(2));
      mkdirp(tempDestination, (err) => {
        if (err) {
          console.error('mkdirp', tempDestination, 'to destination', destination, 'failed');
          console.error(err);
        }
        extract(artifactName, artifactPath, tempDestination, pageDir);
      });
    });
    request
      .get(options, (error, response, body) => {
        if (error) {
          console.error(error);
        }
      })
      .pipe(artifactWriteStream);
  });
}

module.exports = {
  deploy: function(body) {
    const homepage = body.repository.homepage;
    const homepageSplit = homepage.split('/');
    const pnameSplit = homepageSplit.splice(homepageSplit.length - 2, 2);
    const pageDir = path.join(publicDir, ...pnameSplit);
    update(body, pageDir);
  }
};
