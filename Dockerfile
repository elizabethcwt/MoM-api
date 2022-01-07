FROM node:14-alpine

RUN apk update

# Change working directory
WORKDIR "/app"

# Copy package.json and package-lock.json
COPY package*.json ./

RUN npm install

COPY . /app

RUN npm run build

CMD ["npm", "start"]