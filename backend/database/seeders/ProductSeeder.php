<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Product;

class ProductSeeder extends Seeder
{
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
                'stock'       => 0,       // out of stock — good for testing
                'sku'         => 'MON-001',
                'is_active'   => false,   // inactive — good for testing filters
            ],
        ];

        foreach ($products as $data) {
            $seed = rawurlencode(Str::slug($data['name']));
            Product::create([
                ...$data,
                'slug' => Str::slug($data['name']),
                'image_path' => "https://picsum.photos/seed/{$seed}/800/800",
            ]);
        }
    }
}