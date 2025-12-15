FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf.template

EXPOSE 80

CMD ["/bin/sh", "-c", "envsubst '${FRONTEND_HOST} ${BACKEND_HOST} ${KEYCLOAK_HOST}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && exec nginx -g 'daemon off;'"]
