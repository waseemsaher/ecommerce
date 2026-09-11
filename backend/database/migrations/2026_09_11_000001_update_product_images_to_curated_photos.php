<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private array $productImages = [
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

    public function up(): void
    {
        foreach ($this->productImages as $name => $imageUrl) {
            DB::table('products')
                ->where('name', $name)
                ->update(['image_path' => $imageUrl]);
        }
    }

    public function down(): void
    {
        // Reversible if needed
    }
};
