#!/usr/bin/env python

import os
import re

def main():
    if 'GITLAB_CE_PAGES_CNAME_DIR' not in os.environ:
        print 'env GITLAB_CE_PAGES_CNAME_DIR not found'
        return
    if 'GITLAB_CE_PAGES_WEBHOOK_DIR' not in os.environ:
        print 'env GITLAB_CE_PAGES_WEBHOOK_DIR not found'
        return
    GITLAB_CE_PAGES_CNAME_DIR = os.environ['GITLAB_CE_PAGES_CNAME_DIR']
    GITLAB_CE_PAGES_WEBHOOK_DIR = os.environ['GITLAB_CE_PAGES_WEBHOOK_DIR']
    with open(os.path.join(GITLAB_CE_PAGES_CNAME_DIR, 'cname.txt')) as cname_file:
        for line in cname_file:
            line = line.strip()
            print 'handling line:', line
            conf_name = re.sub('[^a-z0-9.]', '-', line) + '.conf'
            split = line.strip().split()
            project_location = split[0]
            server_names = ' '.join(split[1:])
            print 'project location: ', project_location
            print 'server names(CNAME): ', server_names
            with open(os.path.join(GITLAB_CE_PAGES_WEBHOOK_DIR, 'helper', 'template.conf'), 'r') as template_file:
                with open(os.path.join('/etc/nginx/conf.d/', conf_name), 'w') as conf_file:
                    for template_line in template_file:
                        conf_file.write(template_line.replace('<server_names>', server_names).replace('<project_location>', project_location))

if __name__ == '__main__':
    main()
