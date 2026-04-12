FROM php:8.4-fpm-alpine

# System dependencies
RUN apk add --no-cache \
    bash \
    curl \
    git \
    unzip \
    oniguruma-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libxml2-dev \
    icu-dev \
    linux-headers \
    $PHPIZE_DEPS

# PHP extensions
RUN docker-php-ext-install \
    pdo_mysql \
    mbstring \
    bcmath \
    xml \
    intl \
    opcache

# Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# GD
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY docker/php/php.ini /usr/local/etc/php/conf.d/custom.ini

EXPOSE 9000
CMD ["php-fpm"]