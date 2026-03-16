# Backend Laravel pour Render (runtime Docker)
# Sur Render : choisir "Docker" comme environnement, Root Directory = backend

FROM php:8.3-cli

RUN apt-get update && apt-get install -y \
    git unzip libzip-dev libpng-dev libonig-dev libxml2-dev libpq-dev libicu-dev \
    && docker-php-ext-install intl zip pdo_mysql pdo_pgsql mbstring exif pcntl bcmath \
    && apt-get clean && rm -rf /var/lib/apt/lists/* \
    && php -v && php -m | grep -E '^intl$' || (echo "ext-intl missing" && exit 1)

ENV COMPOSER_ALLOW_SUPERUSER=1
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Dépendances PHP
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

COPY . .

RUN composer dump-autoload --optimize

# Rendre storage et bootstrap/cache inscriptibles (migrations, logs, cache)
RUN chmod -R 775 storage bootstrap/cache

# Pas de config:cache au build ni au démarrage : Laravel lit les variables Render à la volée.
EXPOSE 8000
CMD ["sh", "-c", "php artisan migrate --force && exec php artisan serve --host=0.0.0.0 --port=${PORT:-8000}"]
