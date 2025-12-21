FROM quay.io/keycloak/keycloak:25.0

ENV KEYCLOAK_ADMIN=admin
ENV KEYCLOAK_ADMIN_PASSWORD=admin
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true
ENV KC_DB=dev-file

ENTRYPOINT ["/opt/keycloak/bin/kc.sh", "start-dev"]

