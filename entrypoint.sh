#!/bin/sh
/bin/sed -i "s/<relative_url>/${RELATIVE_URL}/" /etc/nginx/nginx.conf
/usr/sbin/nginx
exec "$@"
