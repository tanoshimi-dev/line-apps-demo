<?php

namespace Database\Seeders;

use App\Models\AdminUser;
use App\Models\Service;
use App\Models\StaffSchedule;
use App\Models\StaffService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create admin user
        $admin = AdminUser::firstOrCreate(
            ['username' => 'admin'],
            [
                'password' => Hash::make('admin123'),
                'name' => 'Administrator',
                'role' => 'admin',
                'is_active' => true,
            ]
        );

        // Create sample staff
        $staff1 = AdminUser::firstOrCreate(
            ['username' => 'tanaka'],
            [
                'password' => Hash::make('staff123'),
                'name' => '田中 美咲',
                'role' => 'staff',
                'is_active' => true,
                'specialty' => 'カット・カラー',
                'bio' => '10年以上の経験を持つスタイリスト。トレンドヘアスタイルが得意です。',
            ]
        );

        $staff2 = AdminUser::firstOrCreate(
            ['username' => 'suzuki'],
            [
                'password' => Hash::make('staff123'),
                'name' => '鈴木 健太',
                'role' => 'staff',
                'is_active' => true,
                'specialty' => 'パーマ・トリートメント',
                'bio' => 'ダメージレスな施術を心がけています。髪質改善トリートメントが人気です。',
            ]
        );

        // Create sample services
        $cut = Service::firstOrCreate(
            ['name' => 'カット'],
            [
                'description' => 'シャンプー・ブロー込み',
                'duration_minutes' => 60,
                'price' => 4500,
                'is_active' => true,
                'sort_order' => 1,
            ]
        );

        $color = Service::firstOrCreate(
            ['name' => 'カラー'],
            [
                'description' => 'フルカラー（リタッチ +500円引き）',
                'duration_minutes' => 90,
                'price' => 7000,
                'is_active' => true,
                'sort_order' => 2,
            ]
        );

        $perm = Service::firstOrCreate(
            ['name' => 'パーマ'],
            [
                'description' => 'デジタルパーマ・コールドパーマ対応',
                'duration_minutes' => 120,
                'price' => 8500,
                'is_active' => true,
                'sort_order' => 3,
            ]
        );

        $treatment = Service::firstOrCreate(
            ['name' => 'トリートメント'],
            [
                'description' => '髪質改善トリートメント',
                'duration_minutes' => 45,
                'price' => 3500,
                'is_active' => true,
                'sort_order' => 4,
            ]
        );

        $headSpa = Service::firstOrCreate(
            ['name' => 'ヘッドスパ'],
            [
                'description' => 'リラクゼーション ヘッドスパ',
                'duration_minutes' => 30,
                'price' => 3000,
                'is_active' => true,
                'sort_order' => 5,
            ]
        );

        // Assign services to staff
        foreach ([$cut, $color, $perm, $treatment, $headSpa] as $service) {
            StaffService::firstOrCreate([
                'admin_user_id' => $staff1->id,
                'service_id' => $service->id,
            ]);
        }

        foreach ([$cut, $perm, $treatment, $headSpa] as $service) {
            StaffService::firstOrCreate([
                'admin_user_id' => $staff2->id,
                'service_id' => $service->id,
            ]);
        }

        // Create weekly schedules for staff (Mon-Sat, 10:00-19:00)
        foreach ([$staff1, $staff2] as $staff) {
            for ($day = 1; $day <= 6; $day++) { // Mon(1) - Sat(6)
                StaffSchedule::firstOrCreate(
                    [
                        'admin_user_id' => $staff->id,
                        'day_of_week' => $day,
                    ],
                    [
                        'start_time' => '10:00',
                        'end_time' => '19:00',
                        'is_available' => true,
                    ]
                );
            }
            // Sunday off
            StaffSchedule::firstOrCreate(
                [
                    'admin_user_id' => $staff->id,
                    'day_of_week' => 0,
                ],
                [
                    'start_time' => '10:00',
                    'end_time' => '19:00',
                    'is_available' => false,
                ]
            );
        }
    }
}
