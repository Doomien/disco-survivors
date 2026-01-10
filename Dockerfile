# Use nginx alpine for smallest image size
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy game files to nginx html directory
COPY index.html /usr/share/nginx/html/
COPY game.js /usr/share/nginx/html/
COPY characters.json /usr/share/nginx/html/
COPY assets/ /usr/share/nginx/html/assets/
COPY tools/ /usr/share/nginx/html/tools/
COPY docs/ /usr/share/nginx/html/docs/

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
