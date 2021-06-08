# base image
FROM node:8

# create app directory
# WORKDIR /usr/src/app
WORKDIR ./

# install app dependencies
COPY package*.json ./

COPY . .

RUN npm install
RUN npm install socket.io
RUN npm install node-uuid

# container exposes specified port number
EXPOSE 5000

ENV PORT 4004

# run application
CMD ["node", "app.js"]