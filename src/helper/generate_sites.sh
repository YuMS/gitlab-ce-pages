#!/bin/bash
echo "cleaning sites config"
rm /etc/nginx/conf.d/*
echo "generating sites config for CNAME"
/home/pages/webhook/helper/generate_sites.py
echo "reloading nginx"
/usr/sbin/nginx -s reload
