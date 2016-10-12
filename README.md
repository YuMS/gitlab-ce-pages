# GitLab CE Pages [![Build Status](https://travis-ci.org/YuMS/gitlab-ce-pages.svg?branch=master)](https://travis-ci.org/YuMS/gitlab-ce-pages) [![GitHub tag](https://img.shields.io/github/tag/yums/gitlab-ce-pages.svg?maxAge=2592000)]()

This is an unofficial **GitLab Pages** implementation for **GitLab CE (GitLab Community Edition)**, denoted as **GCP**.

Official **GitLab Pages** is only for GiLab EE, as discussed [here](https://gitlab.com/gitlab-org/gitlab-ce/issues/3085) and [here](https://news.ycombinator.com/item?id=10923747).

Actually, there's already [a project](https://github.com/Glavin001/GitLab-Pages) aiming at the same goal as this one. *Luckily*, I found it after my finishing the initial version of this project.

## What can this project do?

This project is almost compatible with official **GitLab Pages**, which means you can directly use [these GitLab Pages examples](https://gitlab.com/groups/pages) and summon **GCP** to handle the rest (if configured correctly of course). If one day, you switched to **GitLab EE** or **GitLab.com**, or Pages is included into **GitLab CE**,  the immigration would be seamless.

Currently, following features are supported:
 * Pages per project with compatible page generation DSL in `.gitlab-ci.yml` (official doc [here](http://docs.gitlab.com/ee/pages/README.html#project-pages))
 * CNAME support

## Usage

The only ~~supported~~ encouraged way to run **GCP** is with [Docker](https://www.docker.com/).

#### Prerequisite
 * **[GitLab CE 8.4+](https://gitlab.com/)**: GCP cooperates with GitLab rather than `^((?!GitLab).)*$` nor `GitLab (8\.[0-3]\..*|[0-7]\..*|[0-7]|8\.3)`

 * **[GitLab CI](https://about.gitlab.com/gitlab-ci/)**: build is essential for everything. If you haven't enabled GitLab CI, you can take this chance to start trying it. It's totally awesome. Here's the [doc](http://doc.gitlab.com/ce/ci/).

#### Further deploying steps
 * Create an peeking account (I'll name it **page**) for **GCP**. This has to be done in order to retrieve artifacts in private projects. Actually, you can also use an privileged (admin) account to peek at those private projects.
 * Go to **Profile Settings** -> **Account** and copy **Private Token**. This will later be used when running Docker.
 * Get Docker image

 ```
  docker pull yums/gitlab-ce-pages:1.2.1
 ```
 
 * Run Docker container with

 ```
  docker run --name gitlab-ce-pages -d --restart=always \
      --env 'PAGE_PRIVATE_TOKEN=private_token_of_peeking_account' \
      --env 'GITLAB_URL=http://gitlab.example.com/' \
      --env 'PROJECT_ROOT=public' \
      --volume /srv/gitlab-ce-pages/public:/home/pages/public/ \
      --volume /srv/gitlab-ce-pages/cname:/home/pages/cname/ \
      -p 80:80 \
      yums/gitlab-ce-pages:1.2.1
 ```
 
 * Tell your GitLab users the URL of your **GCP** server. They will use it as **webhook URL**. Note that this URL is the one which can actually access your running Docker instance's exposed port.
 * If you want, import some of [these examples](https://gitlab.com/groups/pages) into your own GitLab, as public projects. This will help your users to start building their own pages quickly by just forking them.

#### Enable for project (I expect you, the reader, to retell the following bullet points to your GitLab users, in your own way):
 * Add peeking (I named it **page**, remember?) account as your project members and grant **Reporter** privilege. If an privileged account is used as peeking account, this step is optional.
 * Set **Webhook** in **Project Settings** -> **Webhooks**, tick only **Build event** and fill in **URL** provided by administrator.
 * Write `.gitlab-ci.yml` like demonstrated in [these examples](https://gitlab.com/groups/pages). Or if your administrator has already imported some of them into GitLab, fork one.
 * Wait for build to complete and check your page under `{GITLAB_CE_PAGE_URL}/{WORKSPACE}/{PROJECT_NAME}`.

#### CNAME configuration

CNAME is supported since **GCP 1.1.0**.

Official GitLab Pages service provides a way for users to host their static websites on gitlab.io, also you can point your domain to your \*.gitlab.io using CNAME DNS record. For GCP, things are different: GCP, along with your sites, are hosted on your own server. What GCP needs is actually an **A record** to your server IP in domain DNS records. But since the final purposes of two are similar, both to customize domains. So the name CNAME is used.

With customized domains, you can directly access your projects’ Pages directly under your own domains, without complicated workspace and project name in url. This makes GCP essentially a static site deployer. In fact, you can use GCP to deploy your static site even without owning a running GitLab instance!

Unlike official Pages, we can’t easily set CNAMEs on web UI. GCP uses a configuration file to enable this.

Following are steps to set CNAME:
 * Map some directory to GCP volume `/home/pages/cname` with an additional option of `docker run`. Like

 ```
  --volume /srv/gitlab-ce-pages/cname:/home/pages/cname/
 ```

 * You should find `cnames.txt` in mapped directory.
 * Put your domain names into `cnames.txt` in following format:

 ```
  workspace_1/project_1 domain1.com project1.domain2.com page.domain3.com
  workspace_2/project_2 domain3.com
 ```

   Each line sets domains for a project. Pointing multiple domains to one project is supported.
 * Set your domains’ *A record* to GCP server IP and all settled.

#### Wildcard CNAME configuration

Wildcard CNAME is supported since **GCP 1.3.0**.

Wildcard CNAME is the follow-up to [CNAME configuration](#cname-configuration), which enables GCP to automatically apply some patterns for page routing.

Here's some recipe `cnames.txt`s to use wildcard CNAME:

 * visit generated site of any project named `homepage` directly using workspace name as subdomain name
 
 ```
   $1/homepage ~^(.*)\.example\.com$
 ```
 
 `foo.example.com` will point to `foo/homepage`

 * visit generated site of any project named `{workspace_name}.example.com` directly using workspace name as subdomain name
 
 ```
   $1/$1.example.com ~^(.*)\.example\.com$
 ```
 
 `foo.example.com` will point to `foo/foo.example.com`

You can find your best fit by combination of these.

Note that you need to set *A record* to GCP server IP for all domains/subdomains you want to use. [Here's an example](https://www.godaddy.com/help/setting-up-wildcard-dns-3301) from GoDaddy about how to set wildcard DNS record.

## Upgrading
You can easily upgrade your GCP in following steps:

 * pull latest image

 ```
  docker pull yums/gitlab-ce-pages:1.2.1
 ```
 
 * remove running image

 ```
  docker rm -f gitlab-ce-pages
 ```
 
 * start service with new image
 
 ```
  docker run --name gitlab-ce-pages -d --restart=always \
      --env 'PAGE_PRIVATE_TOKEN=private_token_of_peeking_account' \
      --env 'GITLAB_URL=http://gitlab.example.com/' \
      --env 'PROJECT_ROOT=public' \
      --volume /srv/gitlab-ce-pages/public:/home/pages/public/ \
      --volume /srv/gitlab-ce-pages/cname:/home/pages/cname/ \
      -p 80:80 \
      yums/gitlab-ce-pages:1.2.1
 ```

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
      image: yums/gitlab-ce-pages:1.2.1
      environment:
        - PAGE_PRIVATE_TOKEN=private_token_of_peeking_account
        - GITLAB_URL=http://gitlab.example.com/
        - PROJECT_ROOT=public
      volumes:
        - ./public:/home/pages/public
        - ./cname:/home/pages/cname
      ports:
        - "80:80"
