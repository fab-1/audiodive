FROM node:16-alpine
ENV NODE_ENV=production

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm ci --only=production

COPY . .

EXPOSE 8080

CMD [ "node", "app.js" ]
