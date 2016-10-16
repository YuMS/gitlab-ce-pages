FROM nginx:stable
MAINTAINER yumaoshu@gmail.com

RUN apt-get update \
    && apt-get install --no-install-recommends -y curl

RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -
RUN apt-get install -y nodejs --no-install-recommends

RUN apt-get install --no-install-recommends -y unzip sed

ENV GITLAB_CE_PAGES_HOME="/home/pages" \
    GITLAB_CE_PAGES_USER="pages"

ENV GITLAB_CE_PAGES_PUBLIC_DIR="${GITLAB_CE_PAGES_HOME}/public" \
    GITLAB_CE_PAGES_WEBHOOK_DIR="${GITLAB_CE_PAGES_HOME}/webhook" \
    GITLAB_CE_PAGES_CNAME_DIR="${GITLAB_CE_PAGES_HOME}/cname"

WORKDIR ${GITLAB_CE_PAGES_WEBHOOK_DIR}

COPY src/package.json ${GITLAB_CE_PAGES_WEBHOOK_DIR}/
RUN npm install
RUN npm install -g nodemon

ENV TINI_VERSION v0.10.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]

COPY entrypoint.sh /
COPY config/nginx.conf /etc/nginx/nginx.conf
RUN rm -f /etc/nginx/conf.d/*

COPY src/ ${GITLAB_CE_PAGES_WEBHOOK_DIR}/

EXPOSE 80/tcp

VOLUME ["${GITLAB_CE_PAGES_PUBLIC_DIR}"]
VOLUME ["${GITLAB_CE_PAGES_CNAME_DIR}"]
CMD ["/entrypoint.sh", "/usr/bin/npm", "start"]
