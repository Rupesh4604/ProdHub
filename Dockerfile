# Stage 1: Build the React application
# We use the official Node.js image as a builder.
FROM node:18-alpine as builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker cache
COPY package*.json ./

# Install project dependencies securely and efficiently
RUN npm ci

# Copy the rest of the application source code
COPY . .

# --- Environment Variables ---
# Define arguments that can be passed during the build process.
# These will hold your secret keys.
ARG REACT_APP_FIREBASE_API_KEY
ARG REACT_APP_FIREBASE_AUTH_DOMAIN
ARG REACT_APP_FIREBASE_PROJECT_ID
ARG REACT_APP_FIREBASE_STORAGE_BUCKET
ARG REACT_APP_FIREBASE_MESSAGING_SENDER_ID
ARG REACT_APP_FIREBASE_APP_ID
ARG REACT_APP_GOOGLE_CLIENT_ID
ARG REACT_APP_GEMINI_API_KEY

# Set the environment variables in the container using the build arguments
ENV REACT_APP_FIREBASE_API_KEY=$REACT_APP_FIREBASE_API_KEY
ENV REACT_APP_FIREBASE_AUTH_DOMAIN=$REACT_APP_FIREBASE_AUTH_DOMAIN
ENV REACT_APP_FIREBASE_PROJECT_ID=$REACT_APP_FIREBASE_PROJECT_ID
ENV REACT_APP_FIREBASE_STORAGE_BUCKET=$REACT_APP_FIREBASE_STORAGE_BUCKET
ENV REACT_APP_FIREBASE_MESSAGING_SENDER_ID=$REACT_APP_FIREBASE_MESSAGING_SENDER_ID
ENV REACT_APP_FIREBASE_APP_ID=$REACT_APP_FIREBASE_APP_ID
ENV REACT_APP_GOOGLE_CLIENT_ID=$REACT_APP_GOOGLE_CLIENT_ID
ENV REACT_APP_GEMINI_API_KEY=$REACT_APP_GEMINI_API_KEY

# Build the application for production
RUN npm run build

# Stage 2: Serve the application with Nginx
# Use a lightweight Nginx image for the final container.
FROM nginx:stable-alpine

# Copy the built static files from the 'builder' stage
COPY --from=builder /app/build /usr/share/nginx/html

# Nginx will serve on port 80 by default, so we expose it
EXPOSE 80

# The command to start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]
