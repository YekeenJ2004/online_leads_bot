# Use a lightweight Node.js image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the bot script and other files into the container
COPY . .

# Expose the bot port (if applicable; Discord bots usually don’t need this)
EXPOSE 3000

# Run the bot script
CMD ["node", "index.js"]