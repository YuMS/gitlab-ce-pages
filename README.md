# GitLab CE Pages

[![Build Status](https://travis-ci.org/YuMS/gitlab-ce-pages.svg?branch=master)](https://travis-ci.org/YuMS/gitlab-ce-pages)

This is an unofficial GitLab Pages implementation for **GitLab CE**, denoted as **GCP**.

Official **GitLab Pages** is only for GiLab EE, as discussed [here](https://gitlab.com/gitlab-org/gitlab-ce/issues/3085) and [here](https://news.ycombinator.com/item?id=10923747).

Actually, there's already [a project](https://github.com/Glavin001/GitLab-Pages) aiming at the same goal as this one. *Luckily*, I found it before my finishing the initial version of this project.

## What can this project do?

This project is fully compatible with official GitLab Pages, which means you can directly use [these GitLab Pages examples](https://gitlab.com/groups/pages) and summon **GCP** to handle the rest (if configured correctly of course). If one day, you switched to **GitLab EE** or **GitLab.com**, the immigration would be seamless.

## Usage

The only ~~supported~~ encouraged way to run **GCP** is with [Docker](https://www.docker.com/).

#### Prerequisite
 * **[GitLab CI](https://about.gitlab.com/gitlab-ci/)**: build is essential for everything. If you haven't enabled GitLab CI, you can take this chance to start trying it. It's totally awesome. Here's the [doc](http://doc.gitlab.com/ce/ci/).

#### Further deploying steps
 * Create an peeking account (I'll name it **page**) for **GCP**. This has to be done in order to retrieve artifacts in private projects.
 * Go to **Profile Settings** -> **Account** and copy **Private Token**. This will later be used when running Docker.
 * Get Docker image

 ```
  docker pull yums/gitlab-ce-pages:1.0.2
 ```
 
 * Run Docker container with

 ```
  docker run --name gitlab-ce-pages -d --restart=always \
      --env 'PAGE_PRIVATE_TOKEN=private_token_of_peeking_account' \
      --env 'GITLAB_URL=http://gitlab.example.com/' \
      --env 'PROJECT_ROOT=public' \
      --volume /srv/gitlab-ce-pages/public:/home/pages/public/ \
      -p 8000:80 \
      yums/gitlab-ce-pages:1.0.2
 ```
 
 * Tell your GitLab users the URL of your **GCP** server. They will use it as **webhook URL**. Note that this URL is the one which can actually access your running Docker instance's exposed port. It's encouraged to use `ip`+`port` directly because I may later implement pointing different **CNAME**s to different projects.
 * If you want, import some of [these examples](https://gitlab.com/groups/pages) into your own GitLab, as public projects. This will help your users to start building their own pages quickly by just forking them.

#### Enable for project (I expect you, the reader, to retell the following bullet points to your GitLab users, in your own way):
 * Add peeking (I named it **page**, remember?) account as your project members and grant **Reporter** privilege.
 * Set **Webhook** in **Project Settings** -> **Webhooks**, tick only **Build event** and fill in **URL** provided by administrator.
 * Write `.gitlab-ci.yml` like demonstrated in [these examples](https://gitlab.com/groups/pages). Or if your administrator has already imported some of them into GitLab, fork one.
 * Wait for build to complete and check your page under `{GITLAB_CE_PAGE_URL}/{WORKSPACE}/{PROJECT_NAME}`.

## Environment variables
* **PAGE_PRIVATE_TOKEN**: private token of peeking account
* **GITLAB_URL**: GitLab CE URL
* **RELATIVE_URL**: relative URL of **GCP**, with this you can deploy **GCP** under existing domains with some proxy forwarding.
This variable should looks like `pages`, without prefix or trailing splashes.
* **PROJECT_ROOT**: root directory of decompressed artifacts file. If set, files inside of **PROJECT_ROOT** directory will be taken out.
This variable should looks like `public`, without prefix or trailing splashes. Note that in GitLab's official examples, artifacts are put inside `public` folder and then packed into artifacts.


## Sample `docker-compose.yml`

This is a sample `docker-compose.yml` file for you if you want to use docker-compose. It behaves similarly to the command line version.

    gitlab-ce-pages:
      restart: always
      image: yums/gitlab-ce-pages:1.0.2
      environment:
        - PAGE_PRIVATE_TOKEN=private_token_of_peeking_account
        - GITLAB_URL=http://gitlab.example.com/
        - PROJECT_ROOT=public
      volumes:
        - ./public:/home/pages/public
      ports:
        - "8000:80"
