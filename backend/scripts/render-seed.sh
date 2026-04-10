#!/usr/bin/env bash
# À exécuter dans le Shell Render du service Web (Laravel), pas depuis un PC local
# si vous utilisez l'Internal Database URL.
set -euo pipefail
cd "$(dirname "$0")/.."
php artisan config:clear
php artisan db:seed --class=RenderProductionSeeder --force
