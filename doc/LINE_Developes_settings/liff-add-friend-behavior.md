# LIFF Add friend option の動作

## 設定状況

LINE Developers Console → LIFF設定:

| 項目 | 値 |
|---|---|
| Endpoint URL | https://localhost:3000 |
| Scopes | openid, profile |
| Add friend option | **On (aggressive)** |

## 友だち追加プロンプトが表示される条件

Add friend option を Aggressive に設定していても、プロンプトが表示されるには条件がある。

| 条件 | プロンプト表示 |
|---|---|
| 初回のLIFFアプリ起動 + 友だちでない + **LINEアプリ内** | 表示される |
| 2回目以降（前回「あとで」を選択） | **表示されない**（1回限り） |
| 既に友だち | 表示されない（不要） |
| **外部ブラウザで開いた場合**（LINE外） | **表示されない** |

## 外部ブラウザでは動作しない

`https://localhost:3000` を通常のブラウザで開いた場合、LIFFはLINE Login（Webリダイレクト）にフォールバックする。このモードでは Add friend プロンプトは **サポートされていない**。

```
外部ブラウザ (Chrome等)
  → https://localhost:3000
    → liff.init() → LINE Login (Web redirect)
    → 友だち追加プロンプトは表示されない

LINEアプリ内
  → https://liff.line.me/{liffId}
    → liff.init() → LINEアプリ内認証
    → 友だち追加プロンプトが表示される（初回のみ）
```

## テスト方法

友だち追加プロンプトを確認するには、**LINEアプリ内** でLIFF URLを開く必要がある:

```
https://liff.line.me/{your-liff-id}
```

または、LINEのトーク画面で自分にこのURLを送信してタップする。

## LINEアプリ内 vs 外部ブラウザの違い

| 機能 | LINEアプリ内 | 外部ブラウザ |
|---|---|---|
| 友だち追加プロンプト | 動作する | 動作しない |
| LINE Login | アプリ内認証（自動） | Webリダイレクト |
| liff.getProfile() | 動作する | 動作する |
| liff.getAccessToken() | 動作する | 動作する |
| Push通知（友だちの場合） | 受信可能 | 受信可能 |
