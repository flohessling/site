FROM caddy:2-alpine

RUN addgroup -g 1000 caddy && \
    adduser -D -u 1000 -G caddy caddy

COPY --chown=caddy:caddy ./data /data
COPY --chown=caddy:caddy ./data/Caddyfile /etc/caddy/Caddyfile

USER caddy
