<?php

namespace Database\Seeders;

use App\Models\AdminUser;
use App\Models\ShopNews;
use App\Models\SweetsCategory;
use App\Models\SweetsItem;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin user
        AdminUser::create([
            'username' => 'admin',
            'password' => Hash::make('admin123'),
            'name' => '管理者',
            'role' => 'admin',
            'is_active' => true,
        ]);

        // Staff user
        AdminUser::create([
            'username' => 'staff',
            'password' => Hash::make('staff123'),
            'name' => 'スタッフ田中',
            'role' => 'staff',
            'is_active' => true,
        ]);

        // Categories
        $cake = SweetsCategory::create([
            'name' => 'ケーキ',
            'description' => '季節のフルーツを使った手作りケーキ',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $cookie = SweetsCategory::create([
            'name' => 'クッキー',
            'description' => 'サクサク食感の焼き菓子',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        $chocolate = SweetsCategory::create([
            'name' => 'チョコレート',
            'description' => '厳選カカオのチョコレート',
            'sort_order' => 3,
            'is_active' => true,
        ]);

        $japanese = SweetsCategory::create([
            'name' => '和菓子',
            'description' => '伝統的な和スイーツ',
            'sort_order' => 4,
            'is_active' => true,
        ]);

        // Items - Cake
        SweetsItem::create([
            'category_id' => $cake->id,
            'name' => 'ストロベリーショートケーキ',
            'description' => 'ふわふわスポンジに新鮮なイチゴをたっぷりと。生クリームとの相性抜群です。',
            'price' => 580,
            'stock' => 20,
            'sort_order' => 1,
        ]);

        SweetsItem::create([
            'category_id' => $cake->id,
            'name' => 'チョコレートケーキ',
            'description' => '濃厚なベルギーチョコを使用した贅沢なケーキ。',
            'price' => 620,
            'stock' => 15,
            'sort_order' => 2,
        ]);

        SweetsItem::create([
            'category_id' => $cake->id,
            'name' => 'モンブラン',
            'description' => '国産栗をふんだんに使った秋の定番スイーツ。',
            'price' => 650,
            'stock' => 10,
            'sort_order' => 3,
        ]);

        // Items - Cookie
        SweetsItem::create([
            'category_id' => $cookie->id,
            'name' => 'バタークッキー詰め合わせ',
            'description' => '北海道バターを贅沢に使った6種のクッキー。ギフトにもおすすめ。',
            'price' => 1200,
            'stock' => 30,
            'sort_order' => 1,
        ]);

        SweetsItem::create([
            'category_id' => $cookie->id,
            'name' => 'アーモンドチュイール',
            'description' => '薄くパリッと焼き上げたアーモンドクッキー。',
            'price' => 380,
            'stock' => 25,
            'sort_order' => 2,
        ]);

        // Items - Chocolate
        SweetsItem::create([
            'category_id' => $chocolate->id,
            'name' => 'トリュフチョコレート（6個入）',
            'description' => 'とろける口どけのトリュフチョコ。カカオの風味が広がります。',
            'price' => 1500,
            'stock' => 20,
            'sort_order' => 1,
        ]);

        SweetsItem::create([
            'category_id' => $chocolate->id,
            'name' => '生チョコレート（9個入）',
            'description' => 'なめらかな口どけの生チョコ。北海道産生クリーム使用。',
            'price' => 980,
            'stock' => 15,
            'sort_order' => 2,
        ]);

        // Items - Japanese
        SweetsItem::create([
            'category_id' => $japanese->id,
            'name' => '抹茶大福',
            'description' => '宇治抹茶のあんこを柔らかいお餅で包みました。',
            'price' => 320,
            'stock' => 25,
            'sort_order' => 1,
        ]);

        SweetsItem::create([
            'category_id' => $japanese->id,
            'name' => 'どら焼き',
            'description' => 'ふっくら焼いた皮に自家製つぶあんをたっぷり。',
            'price' => 280,
            'stock' => 30,
            'sort_order' => 2,
        ]);

        // Shop News
        ShopNews::create([
            'title' => 'グランドオープン！',
            'content' => 'スイーツショップがオープンしました！LINE友だち登録でポイントが貯まります。ぜひご利用ください。',
            'is_published' => true,
            'published_at' => now(),
        ]);

        ShopNews::create([
            'title' => '春の新作ケーキ登場',
            'content' => '春限定の桜ケーキが新登場！淡いピンク色のクリームに桜の花びらをあしらった見た目も美しいケーキです。数量限定ですのでお早めに。',
            'is_published' => true,
            'published_at' => now(),
        ]);

        ShopNews::create([
            'title' => 'ポイント2倍キャンペーン',
            'content' => '今月末までポイント2倍キャンペーン実施中！この機会にぜひお買い物をお楽しみください。',
            'is_published' => true,
            'published_at' => now(),
        ]);
    }
}
