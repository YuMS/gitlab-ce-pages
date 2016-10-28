# Changelog

**1.3.3**
- fix severe bug #17 introduced in 1.3.2, add relative path related tests

**1.3.2**(introduced severe bug #17, don’t use)
- fix severe bug #16 introduced in 1.3.1, add related tests

**1.3.1**(introduced severe bug #16, don’t use)
- replace alias in NGINX config with root as mentioned [here](http://nginx.org/en/docs/http/ngx_http_core_module.html#alias)
- remove unwanted trailing slash
- use tini to prevent zombies caused by nodemon #13

**1.3.0**
- add wildcard CNAME support #9 #12

**1.2.1**
- solve child process’ stdout buffer overflow problem #8

**1.2.0**
- prevent non-GitLab request from destroying project pages and GCP service #5

**1.1.0**
- add CNAME (customized domain) support

**1.0.3**
- add docker build test, unit tests and system tests, enable travis ci
- fix a wrong private token caused crash bug

**1.0.2**
- fix a bug when GitLab user has a customized name
- remove artifact after decompressing

**1.0.1**
- make document clearer

**1.0.0**
- basically works
