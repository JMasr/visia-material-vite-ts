FROM node:18-alpine3.18

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json for dependency installation
COPY package*.json ./

# Install project dependencies using `npm ci`
RUN npm install -g http-server pm2
RUN npm ci

# Copy the rest of your application source
COPY . .

# Build the application
RUN npm run build

# Expose the port your app will listen on
EXPOSE 8080

# Start your app with pm2 in the foreground
WORKDIR /app/dist
CMD ["pm2", "start", "http-server", "--name", "visia-ui", "--no-daemon", "--", "-p", "8080"]