FROM node:12.18.2

# Create app directory
RUN mkdir -p /app/node_modules && chown -R node:node /app
WORKDIR /app
COPY website/ ./
USER node
RUN npm install
COPY --chown=node:node . .

EXPOSE 8080
CMD [ "node", "website/app.js" ]