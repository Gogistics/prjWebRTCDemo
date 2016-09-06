#./bin/bash

# start node server
forever start .

# start binaryjs server
forever start ./my_binaryjs/binaryjsServer.js
