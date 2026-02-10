# LINE Messaging APIと友だち関係

## Push通知の前提条件

LINE Messaging APIの **pushメッセージ** (`POST /v2/bot/message/push`) は、ユーザーがLINE公式アカウントの **友だち** である場合のみ動作する。

```
友だちである     → pushMessage("Uabc123", "予約確認") → 配信される
友だちでない     → pushMessage("Uabc123", "予約確認") → 失敗 (error 400)
```

## ユーザーが友だちになる方法

| 方法 | 説明 | 本システムでの対応 |
|---|---|---|
| **Bot link (LIFF)** | LIFFアプリ初回起動時に「友だち追加」を促す画面を表示 | LIFF設定 → Bot link feature = **Aggressive** |
| **手動追加** | ユーザーがLINE公式アカウントを検索して追加 | 常に可能 |
| **QRコード** | LINE公式アカウントのQRコードをスキャン | サロン店内に掲示可能 |

## Bot link feature の設定 (LIFF)

LINE Developers Console → LINE Login チャネル → LIFFタブ で設定する。

| 設定値 | 動作 |
|---|---|
| **Aggressive** | LIFFアプリが開く **前** に「友だち追加」画面を表示。ユーザーは追加またはスキップを選択する。 |
| **Normal** | LIFFアプリが開いた **後** に「友だち追加」オプションを表示。控えめな表示。 |
| **Off** | 友だち追加の促しなし。既に友だちでなければPush通知は届かない。 |

## 本システムでのフロー

```
1. ユーザーがLIFF URLを開く
         │
         ▼
2. Bot link = Aggressive の場合
   ┌──────────────────────────────┐
   │ "Salon Official Account      │
   │  を友だち追加しますか？"       │
   │                              │
   │  [追加]    [あとで]           │
   └──────────────────────────────┘
         │
         ├── [追加]   → 友だちになる → Push通知が届く
         └── [あとで] → 友だちでない → Push通知は届かない
                │
                ▼
3. LIFFアプリが開く（予約機能はどちらでも利用可能）
         │
         ▼
4. ユーザーが予約を作成
         │
         ▼
5. LineService::pushMessage() が実行される
   ├── 友だち   → LINE通知が配信される
   └── 友だちでない → false を返す（ログに警告を記録）
```

## 現在のコードの動作

### LineService.php

Push通知の失敗は **サイレント** — 予約は成功するが、ユーザーにLINE通知は届かない:

```php
public function pushMessage(string $userId, string $message): bool
{
    // ...
    $response = Http::post(self::PUSH_URL, [...]);
    return $response->successful();  // 友だちでない場合 false
}
```

### コントローラー側

Push通知の結果をチェックせず、予約処理は続行される:

```php
// ReservationController::store()
$lineService->pushMessage($member->line_user_id, "予約を受け付けました...");
// Push失敗でも予約は正常に完了する
```

## Push通知が送信されるタイミング

| タイミング | トリガー | コード |
|---|---|---|
| 予約作成時 | 会員がAPI経由で予約 | `ReservationController::store()` |
| 予約確認時 | 管理者がステータス変更 | `AdminReservationController::updateStatus()` |
| 予約キャンセル時 | 管理者がステータス変更 | `AdminReservationController::updateStatus()` |
| メッセージ送信時 | 管理者がメッセージ送信 | `AdminMessageController::store()` |

## 友だち状態による影響

| 条件 | 予約機能 | LINE通知 |
|---|---|---|
| ユーザーが友だち | 動作する | 配信される |
| ユーザーが友だちでない | 動作する | 配信されない（サイレント失敗） |
| Bot link = Aggressive | - | 初回起動時にほとんどのユーザーが友だち追加する |
| Bot link = Off | - | 手動で友だち追加が必要 |

## 推奨設定

LINE Developers Console → LIFFタブ → Bot link feature を **Aggressive** に設定する。これにより、ほとんどのユーザーがLIFFアプリ初回起動時にLINE公式アカウントを友だち追加し、Push通知が正常に届くようになる。
