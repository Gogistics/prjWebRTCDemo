# my mongodb standalone
FROM    mongo

# File Author / Maintainer
MAINTAINER Alan Tai <gogistics@gogistics-tw.com>

# run commands
RUN    apt-get update && \
	   DEBIAN_FRONTEND=noninteractive apt-get install -yq apt-utils git build-essential supervisor && \
	   apt-get update && \
	   apt-get clean

# set env; may not necessary, it's up to you
ENV    backup_user=webrtc_user user_pwd=standalonewebrtcuser

# create volume; /data/db for replica set /data/arb for arbiter
VOLUME   /data/db

# add files to working dir; remember to have backup.sh and config.sh executable
COPY   ./backup.sh ./config.sh /my_scripts/
COPY   ./mongodb-keyfile /opt/keyfile/
COPY   ./my_supervisord.conf /etc/supervisor/conf.d/

# directory
ADD    ./data/backup /data/backup

# Install app dependencies
RUN    chmod 600 /opt/keyfile/mongodb-keyfile && \
	   chown 999 /opt/keyfile/mongodb-keyfile && \
	   chmod +x /my_scripts/backup.sh

# set work dir
WORKDIR /my_scripts

# expose ports
EXPOSE  27017

# standalone --dbpath /data/db
CMD mongod --dbpath /data/db --smallfiles --keyFile /opt/keyfile/mongodb-keyfile