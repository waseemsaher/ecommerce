docker compose exec app php artisan make:migration create_cart_items_table
docker compose exec app php artisan make:migration create_orders_table
docker compose exec app php artisan make:migration create_order_items_table
docker compose exec app php artisan make:migration create_payments_table
docker compose exec app php artisan migrate
# Create all models
docker compose exec app php artisan make:model Product
docker compose exec app php artisan make:model Cart
docker compose exec app php artisan make:model CartItem
docker compose exec app php artisan make:model Order
docker compose exec app php artisan make:model OrderItem
docker compose exec app php artisan make:model Payment

mkdir -p app/Enums

# Create seeders
docker compose exec app php artisan make:seeder ProductSeeder
docker compose exec app php artisan migrate --seed
