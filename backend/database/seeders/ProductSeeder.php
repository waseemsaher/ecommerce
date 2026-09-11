<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Product;

class ProductSeeder extends Seeder
{
    private array $images = [
        'Wireless Headphones' => 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        'Mechanical Keyboard' => 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
        'USB-C Hub'           => 'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=800&q=80',
        'Webcam 1080p'        => 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?auto=format&fit=crop&w=800&q=80',
        'Desk Lamp LED'       => 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
        'Mouse Pad XL'        => 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
        'Laptop Stand'        => 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80',
        'Portable SSD 1TB'    => 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80',
        'Bluetooth Speaker'   => 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80',
        'Monitor 27" 4K'      => 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
    ];

    public function run(): void
    {
        $products = [
            [
                'name'        => 'Wireless Headphones',
                'description' => 'Premium noise-cancelling wireless headphones.',
                'price'       => 99.99,
                'stock'       => 50,
                'sku'         => 'WH-001',
                'is_active'   => true,
            ],
            [
                'name'        => 'Mechanical Keyboard',
                'description' => 'Compact TKL mechanical keyboard with RGB.',
                'price'       => 79.99,
                'stock'       => 30,
                'sku'         => 'KB-001',
                'is_active'   => true,
            ],
            [
                'name'        => 'USB-C Hub',
                'description' => '7-in-1 USB-C hub with HDMI and PD charging.',
                'price'       => 39.99,
                'stock'       => 100,
                'sku'         => 'HUB-001',
                'is_active'   => true,
            ],
            [
                'name'        => 'Webcam 1080p',
                'description' => 'Full HD webcam with built-in microphone.',
                'price'       => 59.99,
                'stock'       => 40,
                'sku'         => 'CAM-001',
                'is_active'   => true,
            ],
            [
                'name'        => 'Desk Lamp LED',
                'description' => 'Adjustable LED desk lamp with USB charging port.',
                'price'       => 29.99,
                'stock'       => 75,
                'sku'         => 'LAMP-001',
                'is_active'   => true,
            ],
            [
                'name'        => 'Mouse Pad XL',
                'description' => 'Extended gaming mouse pad, water resistant.',
                'price'       => 19.99,
                'stock'       => 200,
                'sku'         => 'MP-001',
                'is_active'   => true,
            ],
            [
                'name'        => 'Laptop Stand',
                'description' => 'Aluminium adjustable laptop stand.',
                'price'       => 49.99,
                'stock'       => 60,
                'sku'         => 'LS-001',
                'is_active'   => true,
            ],
            [
                'name'        => 'Portable SSD 1TB',
                'description' => 'Fast portable SSD, USB 3.2 Gen 2.',
                'price'       => 109.99,
                'stock'       => 25,
                'sku'         => 'SSD-001',
                'is_active'   => true,
            ],
            [
                'name'        => 'Bluetooth Speaker',
                'description' => 'Waterproof portable bluetooth speaker.',
                'price'       => 69.99,
                'stock'       => 45,
                'sku'         => 'SPK-001',
                'is_active'   => true,
            ],
            [
                'name'        => 'Monitor 27" 4K',
                'description' => '27 inch 4K IPS monitor, 144Hz.',
                'price'       => 399.99,
                'stock'       => 0,
                'sku'         => 'MON-001',
                'is_active'   => false,
            ],
        ];

        foreach ($products as $data) {
            $slug = Str::slug($data['name']);
            $image = $this->images[$data['name']] ?? "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80";

            Product::create([
                ...$data,
                'slug' => $slug,
                'image_path' => $image,
            ]);
        }
    }
}