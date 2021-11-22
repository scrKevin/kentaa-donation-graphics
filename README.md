# kentaa-donation-graphics

## Usage



## Installation
```shell
# Install NodeJS

# Install kentaa-donation-graphics

sudo apt install git

cd ~/
git clone https://github.com/scrKevin/kentaa-donation-graphics.git

cd kentaa-donation-graphics

npm install

# Install certbot
sudo add-apt-repository ppa:certbot/certbot
sudo apt-get update
sudo apt-get install certbot

# At this point you'll need to make sure you have port 80 open in your Security
# Group and the (sub)domain you want to use for the certificate pointing to the
# pubic IP-address of the server. Update the line below to match the
# (sub)domain you want to use.

domain="example.com"
sudo certbot certonly --standalone

# Ensure our "ubuntu" user can access the certificates

sudo chmod 0755 /etc/letsencrypt/{live,archive}
sudo chgrp ubuntu /etc/letsencrypt/live/$domain/privkey.pem
sudo chmod 0640 /etc/letsencrypt/live/$domain/privkey.pem

# Symlink the certificates into the kentaa-donation-graphics installation

cd ~
cd kentaa-donation-graphics
ln -s /etc/letsencrypt/live/$domain/fullchain.pem cert/fullchain.pem
ln -s /etc/letsencrypt/live/$domain/privkey.pem cert/privkey.pem
```