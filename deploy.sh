#!/bin/bash
cd /home/ubuntu/koenigskristall-shop-backend
git pull origin master
npm install  # Install any new dependencies
pm2 restart koenigskristall-shop-backend  # Restart the app
