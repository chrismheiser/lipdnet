# Use an official Node.js runtime as the base image
FROM node:14-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the rest of the application code to the container
COPY . .

WORKDIR /app/website 

# Copy the package.json and package-lock.json files to the container
COPY package*.json ./

# Install build tools
RUN apk add --no-cache build-base krb5-dev
RUN apk add --no-cache python3

# Install the Node.js dependencies
RUN npm install

# Expose the port that the web application will listen on
EXPOSE 3000

# Run the web application
CMD ["npm", "start"]