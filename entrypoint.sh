#!/bin/sh
/bin/sed -i "s/<relative_url>/${RELATIVE_URL}/" /etc/nginx/nginx.conf
touch $GITLAB_CE_PAGES_CNAME_DIR/cname.txt
nodemon -L --exec 'bash $GITLAB_CE_PAGES_WEBHOOK_DIR/helper/generate_sites.sh' --watch $GITLAB_CE_PAGES_CNAME_DIR/cname.txt &
/usr/sbin/nginx
exec "$@"
