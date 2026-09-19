# LEARNINGS — 242｜コン太と夕焼け廃工場

- 日付: 2026-09-19
- 位置づけ: `242-day066`（本文のみ存在・タイトル未確定・iOS操作盤未実装）を、タイトル確定＋コントロールパネル実装＋公開まで仕上げる作業

## 何をしたか

- フォルダ名を `242-day066` → `242-konta-factory` に変更（タイトル「コン太と夕焼け廃工場」に基づく）。メインファイルを `konta-factory.html` → `index.html` にリネーム（harness / publish.sh の必須要件）
- `#game-shell` / `#game-stage` / `#screen-wrap` / `#control-deck` 構造を導入し、画面下25%を操作盤として固定（`279-haisen-dash` の実装パターンを踏襲）
- 方向ボタン・アクションボタンを `touchstart`+`mousedown` の二重バインドから Pointer Events（`setPointerCapture`）へ統一
- 一時停止ボタンを新設（既存にはゼロだった）。`visibilitychange` によるバックグラウンド自動停止も追加
- `localStorage` キーを `konta-best` → `tg.242.best` に変更（同一オリジン上の他ゲームとの衝突を避ける命名規約に合わせた。未公開のため移行処理は不要と判断）
- Canvas を `devicePixelRatio`（上限2）でバッキングストア化し、`data-logical-width/height` を付与（harnessの「Canvas上段フィット」判定に必要）
- ダブルタップズーム防止一式（`touch-action` / `gesturestart` / `touchend`300ms抑止 / `selectstart` / `dragstart`）を追加
- ゲームロジック本体（移動・当たり判定・敵AI・描画）は無改造

## 設計上の判断

- 音声（BGM/SE）は元々ゼロだったため、ミュートトグルは追加しなかった。「音が鳴るのに消せない」問題への対処であって、無音のゲームにミュートUIだけ足すのは頼まれていない機能追加になると判断（SPEC.md に明記）
- タイトル画面・操作ヒントは元々DOM（`<h1>`+`<p class="help">`）だったが、canvas内描画に統合。理由：`#game-stage` の常時レイアウト面積を確保し、harnessの「Canvas上段フィット」（占有率90%以上）を素直に満たすため

## 検証（証跡）

### `_tools/game-harness.mjs`

```
PASS  index.html: 存在
PASS  モバイル幅: 390px / viewport 390px
PASS  Canvas: 960×540
PASS  描画ループ: 61 RAF/秒
PASS  タップ: イベント送信成功
PASS  コンソールエラー: 0件
PASS  リクエスト失敗: 0件
PASS  通信量20MB以下: 0.02MB（上限20.00MB）
PASS  iOS領域75/25: 操作盤 24.9%
PASS  ゲームと操作盤の非重複: 境界分離
PASS  操作盤内に収まる: deck=fit / viewport=fit
PASS  操作ボタン48px以上: 全ボタン適合
PASS  Canvas上段フィット: 0.78× / 0.78×・占有率 95.9%
PASS  操作盤表示・safe-area余白: 表示=yes / 下余白=10px
RESULT PASS
```

レポート: `docs/harness-reports/242-konta-factory-2026-09-19T07-09-22-804Z.md`

### 手動プレイテスト（Claude Browser / 375×812 モバイルエミュレーション）

- タイトル→タップでプレイ開始を確認
- 右移動ボタン押下でコン太が実際に右へ移動し、進行度バーが伸びることを確認
- ジャンプボタン→足場に着地、ヤリボタン→攻撃モーションが出ることを確認
- 一時停止ボタン→「一時停止中／タップして再開」オーバーレイが表示、再度押下で復帰することを確認

## 未検証・正直に残すこと

- **iPhone実機では未確認**（検証はharnessのPlaywright/WebKitとClaude Browserのエミュレーションのみ）
- 音声を今後追加する場合の設計（現状は完全無音のまま）
- 敵配置・難易度バランスは元実装のまま、今回は未調整

## 2026-09-19 公開（GitHub Pages）
- URL: https://titan11111.github.io/242-konta-factory/ （HTTP 200・Pages status=built を実測）
- publish.sh が OGP タグを index.html へ挿入したため、**公開実体で harness を取り直した**: `docs/harness-reports/242-konta-factory-2026-09-19T07-20-19-018Z.md` → 14項目すべて PASS
- 学び: publish.sh の OGP 挿入は harness の後に走る。公開後の実体で1回取り直さないと、証跡が公開物と一致しない
- 未検証: iPhone実機（harness は Playwright/WebKit 390px のみ）

## 2026-09-19 旧URLの404を修復
- 症状: `https://titan11111.github.io/242-konta-factory/konta-factory.html` が **404**。本体（`/242-konta-factory/`）は 200 で生きていた
- 原因: エントリを `konta-factory.html` → `index.html` へ改名したため、**改名前に配ったリンクだけが死んだ**。リポジトリもPagesも正常
- 対処: `konta-factory.html` を index.html へのリダイレクト専用ページとして復活（meta refresh ＋ `location.replace()` の二段。`?query`・`#hash` も引き継ぐ）
- 検証: 旧URL **404 → 200** を Pages ビルド完了後に実測。本体URLも 200 のまま
- 学び: **エントリ名を変えたら旧名をリダイレクトとして残す**。フォルダ改名と違い「本体は200」なので気づけない
- 検出: `_tools/check-legacy-entry.sh` で機械検出できるようにした（245で同じ事故が出たのを機に新設）

### 【訂正】上の「404だった」は誤り（2026-09-19 同日中に判明）
- gitで裏を取った結果、`konta-factory.html` は**このリポジトリで一度も公開されていなかった**（`git cat-file -e <修復コミット>^:konta-factory.html` → 不在）。
  改名はローカルフォルダ内で完結しており、リポジトリは改名**後**に作成されている
- つまり `…/242-konta-factory/konta-factory.html` というURLは**元から存在しない**。「配ったリンクが死んだ」という上の記述は**誤り**
- 置いたリダイレクトは**害はないが、壊れていたものを直したわけではない**（将来その名前で来た人を受けるだけの保険）
- 誤認の原因: LEARNINGS.md の本文を証拠として扱ったこと。**本文は作業メモであって証拠ではない。証拠はgit履歴**
- 検出器も v2 で「git履歴に存在 かつ HEADに不在」判定へ作り直した（`_tools/check-legacy-entry.sh`）
