#!/bin/bash
# config. shell
echo "use admin" >> authentication.js
echo "db.createUser({user:'siteUserAdmin',pwd:'standaloneadmin',roles:[{role:'userAdminAnyDatabase',db:'admin'}]})" >> authentication.js
echo "db.auth('siteUserAdmin', 'standaloneadmin')" >> authentication.js
echo "db.createUser({user:'siteRootAdmin',pwd:'standaloneadmin',roles:[{role:'root',db:'admin'}]})" >> authentication.js
echo "db.auth('siteRootAdmin', 'standaloneadmin')" >> authentication.js
echo "use webrtc" >> authentication.js
echo "db.createUser({user:'webrtc_user',pwd:'standalonewebrtcuser',roles:[{role:'readWrite',db:'webrtc'}]})" >> authentication.js
echo "db.auth('webrtc_user', 'standalonewebrtcuser')" >> authentication.js

# run script
mongo < authentication.js

# restart supervisord
/etc/init.d/supervisor restart