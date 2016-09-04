#!/bin/bash
# check if image exist; if not exist, create new image
app_image='alantai/mongo_standalone'
inspect_result=$(docker inspect $app_image)
if [ "[]" == "$inspect_result" ]; then
  echo "image does not exist"
  docker build -t ${app_image} .
fi

# run main container
app_container='mongo_standalone'
inspect_result=$(docker inspect $app_container)
if [ "[]" == "$inspect_result" ]; then
  echo "container does not exist and a new one will be created..."
  docker run --name ${app_container} -p 27025:27027 -d ${app_image}
else
  echo "this container already exists!"
fi

# run config.sh
docker exec -d ${app_container} bash ./config.sh

# backup
docker exec -d ${app_container} bash ./backup.sh

# check logs
docker logs ${app_container}