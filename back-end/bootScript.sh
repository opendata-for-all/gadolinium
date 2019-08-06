
#MASTER SETUP SCRIPT TO COPY AND PASTE
#!/usr/bin/env bash
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt install nodejs
yes | sudo apt-get install git
yes | sudo apt-get install build-essential
git clone https://github.com/SOM-Research/gadolinium
cd gadolinium/front-end/
npm install
sudo npm install -g pug-cli
npm run build
cd ../back-end/
npm install
cd master
sudo npm install -g forever
sudo forever start --uid "gado" -a index.js


#SLAVE INSTANCE TEMPLATE STARTUP SCRIPT TO COPY AND PASTE
#!/usr/bin/env bash
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt install nodejs
yes | sudo apt-get install git
yes | sudo apt-get install build-essential
git clone https://github.com/SOM-Research/gadolinium
INSTANCENAME=$(curl -H Metadata-Flavor:Google http://metadata/computeMetadata/v1/instance/hostname | cut -d. -f1)
cd gadolinium/back-end/
sudo npm install -g npm-install-missing
sudo npm install
sudo npm-install-missing
cd slave
node index.js "$INSTANCENAME" "$IPADDRESS"

