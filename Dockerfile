# Use Node.js 22.12 alpine for a lightweight image
FROM node:22.12-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source files (excluding files in .gitignore)
COPY . .

# Build the application
RUN npm run build

# Expose the port that serve uses
EXPOSE 8243

# Start the application
CMD ["npm", "run", "serve"]
