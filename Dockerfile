FROM node:18-alpine 

WORKDIR /app

RUN apk add --no-cache ffmpeg

RUN apk add --no-cache --virtual .gyp python3 make g++

COPY package*.json ./
RUN npm install 

RUN apk del .gyp

COPY . .
 
EXPOSE 3000

CMD ["npm", "run", "dev"]