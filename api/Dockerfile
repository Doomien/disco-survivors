# Use Node.js LTS (Long Term Support) version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy application source
COPY src/ ./src/

# Create logs directory
RUN mkdir -p logs && chown -R node:node logs

# Expose port
EXPOSE 3334

# Set environment
ENV NODE_ENV=production

# Start the application (run as root to handle volume permissions)
CMD ["node", "src/index.js"]
