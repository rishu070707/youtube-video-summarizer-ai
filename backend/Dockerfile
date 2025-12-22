
FROM node:20
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* ./
RUN npm install --production
COPY . .
EXPOSE 4000
CMD ["npm", "start"]
