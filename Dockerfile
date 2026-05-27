# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Run the application
FROM node:20-alpine
WORKDIR /app

# Copy the built files from the previous stage
COPY --from=builder /app/.output .output

# Expose the port
ENV PORT=5173
EXPOSE 5173

# Run the application
CMD ["node", ".output/server/index.mjs"]
