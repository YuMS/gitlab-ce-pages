#/bin/bash
echo "cleaning sites config"
rm /etc/nginx/conf.d/*
echo "generating sites config for CNAME"
while read line; do
    echo "handling line: $line"
    conf_name="${line//[^a-z0-9.]/-}.conf"
    server_names=`expr "$line" : '\(.*\)\s\+'`
    project_location=`expr "$line" : '.*\s\+\(\S\+\)\$'`
    echo "generating site config: $conf_name"
    echo "server names(CNAME): $server_names"
    echo "project location: $project_location"
    project_location="${project_location/\//\\/}"
    cp ${GITLAB_CE_PAGES_WEBHOOK_DIR}/helper/template.conf /tmp/$conf_name
    /bin/sed -i "s/<server_names>/${server_names}/" /tmp/$conf_name
    /bin/sed -i "s/<project_location>/$project_location/" /tmp/$conf_name
    mv /tmp/$conf_name /etc/nginx/conf.d/
done < ${GITLAB_CE_PAGES_CNAME_DIR}/cname.txt
/usr/sbin/nginx -s reload
