# site

personal terminal-style website with boot sequence and interactive commands.

## development

the site is built with vanilla javascript and served via caddy web server.

- `data/www/` - static files
- `data/www/assets/` - css, js, fonts
- `data/Caddyfile` - web server configuration

## deployment

```bash
docker-compose build
docker-compose up -d
```

## development

```bash
docker-compose -f docker-compose.dev.yml up
```
