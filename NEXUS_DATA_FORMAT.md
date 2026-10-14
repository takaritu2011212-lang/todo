# NEXUS キャラクターデータ形式 v1.0

この文書は、NEXUSの会話辞書ExcelとJSONバンドルの取り決めです。会話処理はブラウザ内のルールベースで行い、外部AI APIには接続しません。検索機能は設定された検索サイトを開くだけで、結果の取得・解析・要約は行いません。

## Excelから読み込むシート

列名は変更しないでください。行の追加・削除はできます。enabled は TRUE / FALSE で指定します。空欄は原則として有効扱いになるため、無効化したい行には FALSE を明示してください。

### 03_キャラクター
必須: character_id, display_name
- character_id: 固定ID。例 CHAR_RION。同じキャラクターを更新するときはIDを維持します。
- display_name: 画面に表示する名前。
- personality, first_person, user_call, tone, ending_style, default_affection, enabled, notes: キャラクターの基本設定。
- 1回のアップロードでは、最初に enabled=TRUE となっているキャラクター行を読み込みます。別キャラクターにする場合は、コピーしたExcelでそのキャラクターのID・名前を設定し、読み込ませたい行だけを有効にしてください。

### 01_単語辞書
使用列: keyword_id, category, keyword, synonyms, priority, response_id, character_id, condition_id, event_id, match_type, enabled, notes
- keyword_id は重複しない固定IDにします。
- keyword が基本語、synonyms はカンマ区切りの別表記です。
- priority が大きい候補を優先します。同じ優先度なら長い一致語を優先します。
- character_id は対象ID、* は全キャラクターです。空欄は読み込み対象キャラクター用として扱われます。
- condition_id は条件セットIDです。未指定なら条件なしとして扱います。

### 02_定型文
使用列: response_id, category, character_id, response_text, tone, min_affection, max_affection, required_flag, forbidden_flag, cooldown_minutes, weight, enabled, notes
- response_text が実際に表示する文章です。
- 好感度の範囲とフラグ条件を満たす文章だけが候補になります。
- required_flag / forbidden_flag はフラグIDを指定します。複数指定はカンマ区切りです。
- 同じカテゴリーに複数の返答を登録すると、連続した同文を避けて選びます。

### 08_最優先フレーズ
使用列: phrase_id, intent, canonical_text, accepted_variants, normalization, priority, response_pool_id, character_id, min_affection, max_affection, random_mode, cooldown_seconds, enabled, notes
- 通常の単語辞書より先に判定します。
- accepted_variants はカンマ区切り。句読点や全角・半角の違いは正規化して照合します。
- response_pool_id に ACTION_SHOW_STATUS を指定するとステータス表示、ACTION_WEB_SEARCH を指定すると検索サイトを開きます。
- その他は intent とカテゴリーをもとに返答候補を選びます。

### 04_イベント一覧
使用列: event_id, event_name, character_id, trigger_type, trigger_value, condition_id, condition_expr_override, once_only, set_flags, clear_flags, affection_delta, response_id, priority, enabled, notes
- 現行エンジンでは trigger_type=keyword のキーワードイベントを実行します。
- trigger_value には対象の keyword_id を指定します。
- set_flags は FLAG_NAME=true のように記述し、複数指定はカンマ区切りです。
- once_only=TRUE のイベントは、同じキャラクターで一度だけ実行します。

### 05_フラグ定義 / 06_条件セット
- フラグIDは大文字英数字とアンダースコアを推奨します。
- 条件式では affection, hour, mood とフラグIDを参照できます。
- 比較演算子: ==, !=, >=, <=, >, <
- 論理演算子: 大文字の AND, OR
- 例: affection >= 30 AND FLAG_SHARED_HOBBY == true
- 条件式は信頼できないコードとして扱い、JavaScriptとして実行することはありません。

## JSONバンドル形式

JSON書き出しでは、読み込んだキャラクターを以下の形で保存します。

    {
      "schemaVersion": "1.0",
      "bundleId": "IMPORT_CHAR_RION",
      "character": {
        "id": "CHAR_RION",
        "name": "リオン",
        "personality": "親しみやすく、少し皮肉っぽい",
        "firstPerson": "僕",
        "userCall": "きみ",
        "tone": "casual",
        "endingStyle": "soft",
        "defaultAffection": 0,
        "greeting": "こんにちは。今日は何を話そう？"
      },
      "keywords": [],
      "responses": [],
      "priorityPhrases": [],
      "events": [],
      "flags": [],
      "conditions": [],
      "settings": {
        "reminderMinutes": 5,
        "searchBaseUrl": "https://www.google.com/search?q=",
        "noAi": true,
        "searchOnlyOpensSite": true
      }
    }

## 安全な編集・アップロード

1. 元ファイルを複製して編集します。
2. 別キャラクターの場合は character_id と display_name を変更します。IDは他キャラと重複させません。
3. そのキャラクター用に編集したい行の character_id も合わせます。共通の語句は * を使えます。
4. 読み込み時は既存データを自動削除しません。同じIDが存在する場合は更新確認を行います。
5. 読み込みに失敗した場合は、エラー表示を確認し、元データはそのまま残してください。

データは利用中のブラウザに保存されます。重要な変更の前後でJSON書き出しを行ってください。


## 複数ファイルの取り込み（v1.1）

- 「Excel / JSON取込」は複数ファイルを一度に選択できます。ファイル数に固定上限は設けていません（実際の保存容量はブラウザの制限を受けます）。
- キャラクター情報シートを持つ従来型ブックは、キャラクターバンドルとして読み込みます。
- 単語辞書だけのExcelは、`keyword` / `キーワード` / `単語` 列を持つシートから読み込み、現在選択中のキャラクターの辞書へ統合します。シート名は `01_単語辞書`、`単語辞書`、`キーワード辞書`、`辞書` などに対応し、見つからない場合は先頭シートを読みます。
- 単語辞書JSONは配列、または `{ "keywords": [...] }` の形式でも読み込めます。完全なNEXUS JSONは従来どおりキャラクター単位で読み込みます。
- 正規化したキーワードが重複した場合は二重登録せず、既存行を更新します。取り込み後は「JSON書出し」で統合済みの辞書をJSONとして保存できます。
