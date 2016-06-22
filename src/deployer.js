"use strict";
const fs = require('fs');
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

function extract(artifactName, artifactPath, destination) {
  exec('unzip ' + artifactPath + ' -d ' + destination, (err, stdout, stderr) => {
    if (err) {
      console.error('unzip', artifactName, 'failed');
      console.error(err);
    } else {
      console.log('unzipped', artifactName, 'into', destination);
      if (projectRoot) {
        console.log('moving files out of', projectRoot);
        exec('cd ' + destination + ' && mv ' + projectRoot + ' PROJECT_ROOT && cd PROJECT_ROOT && mv ./* .. && cd .. && rm -rf PROJECT_ROOT',
          (err, stdout, stderr) => {
            if (err) {
              console.error('moving', projectRoot, 'failed');
              console.error(err);
            } else {
              console.log('moving', projectRoot, 'succeed');
            }
          }
        );
      }
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
      extract(artifactName, artifactPath, pageDir);
    });
    request
      .get(options)
      .pipe(artifactWriteStream);
  });
}

module.exports = {
  deploy: function(body) {
    const pname = body.project_name.replace('.', '');
    const pnameSplit = pname.split(' / ');
    const pageDir = path.join(publicDir, ...pnameSplit);
    fs.stat(pageDir, (err, stats) => {
      if (err) {
        update(body, pageDir);
      } else {
        rimraf(pageDir, () => {
          update(body, pageDir);
        })
      }
    });
  }
};
