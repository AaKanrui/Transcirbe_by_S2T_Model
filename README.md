Transcribe Project (Standalone)

概要
- ローカルで音声ファイル（m4a/mp3 など）を分割 → OpenAI の音声モデルで文字起こし → MD/TXT で保存します。
- Web UI（ブラウザ）で操作。モデル選択、分単位スライダー（0.5〜15 分）、進捗（ステップ/チャンク）表示に対応。
- ffmpeg は同梱バイナリを優先使用（なければ PATH 上の ffmpeg を使用）。

要件
- Node.js 18 以上（推奨: 22）。
- ネットワーク接続（OpenAI API を呼び出します）。
- Linux の場合は同梱の静的 ffmpeg をそのまま利用可能。macOS/Windows は `ffmpeg` を各自導入するか、`project/bin/ffmpeg/ffmpeg` に置いてください。

クイックスタート
1) 依存関係のインストール
   cd project
   npm install

2) ffmpeg の用意（どちらか）
   - Linux: npm run setup  （静的 ffmpeg を project/bin/ffmpeg/ffmpeg にダウンロード）
   - 既にお持ちの場合: `project/bin/ffmpeg/ffmpeg` にコピー、または PATH に `ffmpeg` を通す

3) 起動
   npm start
   ブラウザで http://localhost:3333 を開く

使い方
- 画面上部に OpenAI API キー（sk-...）を貼り付ける。
- 音声ファイルを選択。
- 出力形式（Markdown/TXT）、モデル（gpt-4o-transcribe / gpt-4o-mini-transcribe / whisper-1）、分割長（0.5〜15 分）を選択。
- 実行を押すと、下部にログ（進捗・選択モデル・ファイル名など）と「ステップ x/y | チャンク i/n」が表示され、完了するとダウンロードリンクが出ます。

プロジェクト構成
- project/server.js: Web サーバ（Express + Multer 2.x）。アップロード、進捗、ダウンロード、ヘッダ整形を担当。
- project/src/transcribe.js: パイプライン本体（ffmpeg 分割 → OpenAI 音声 API → MD/TXT 出力）。
- project/public/: フロントエンド（index.html, main.js）。モデル選択、分割スライダー、ログ/進捗表示。
- project/bin/ffmpeg/ffmpeg: 同梱 ffmpeg（任意）。
- project/.data/: 実行時に作成されるジョブと一時ファイル置き場。

設計メモ（なぜこの形か）
- 分割（0.5〜15 分）: 音声モデルの入力制約と安定性を踏まえ、長尺は 1 ショットではなく分割して送る設計。UI は秒ではなく分で操作しやすく、最小 30 秒刻みのスライダーにしました。
- モデル選択と自動フォールバック: 「精度優先/コスト優先/従来モデル」の使い分けを UI で行い、失敗時は他モデルに自動切替。
- ローカル ffmpeg 優先: 環境依存を減らすため、プロジェクト内に静的バイナリを配置可能に。PATH にある ffmpeg も使えます。
- 進捗の可視化: ステップ（分割→文字起こし→生成→完了）とチャンク進捗をサーバ→UI へポーリングで提示。
- ファイル名の日本語対応: ブラウザ→サーバのアップロード時に非 ASCII 名が化けやすいため、UTF‑8 名を別フィールドで同送＋サーバ側で Latin‑1 誤復号の復元ヒューリスティックを実装。ダウンロード時は `filename` と `filename*`（RFC 5987）を併記して互換性を高めています。

機能一覧（このプロジェクトで追加したもの）
- モデルセレクター: gpt‑4o‑transcribe / gpt‑4o‑mini‑transcribe / whisper‑1。
- 自動フォールバック: 選択モデルが失敗した場合に他モデルへ切替。
- 分割スライダー: 0.5〜15 分（最小 30 秒刻み）。注記つき。
- 進捗表示: ステップ x/y と チャンク i/n、ログには使用モデル（ok: <model>）を表示。
- 日本語ファイル名対応: 送信側の UTF‑8 名同送、受信側の復元、DL 時の `filename*` 併記。
- スタンドアロン化: project/ 以下に最小必要物のみを配置し、`.data/` に実行成果物を隔離。

環境設定（API キー）
- 画面で手入力するのが基本です。
- 便利機能として、リポジトリ直下にある `OpenAI_API_Key.md` を `project/` の親ディレクトリから読み込み可能（「OpenAI_API_Key.md から読込」ボタン）。
  - 例: `OpenAI_API_Key.md` に \`\`\` の中で `sk-...` を記述。

トラブルシューティング
- 401/403: API キーや権限を確認。
- 413/サイズ超過: 分割長を短くする（例: 10 分 → 5 分）。
- 429/レート制限: 待機して再実行。
- ffmpeg not found: `npm run setup`（Linux）または ffmpeg を PATH に追加。
- ダウンロード名が再度化ける: ブラウザ依存の可能性。別ブラウザで試す、または ZIP 包装/明示ファイル名フィールドを追加（対応可能）。

既知の制限
- 話者分離（A/B）やタイムスタンプは未実装（要望があれば追加可能）。
- 翻訳は行わず、日本語のまま出力（翻訳版を別出力として増設可能）。
- 超長時間ファイルは分割推奨。スライダー上限は 15 分です。

開発メモ/コマンド
- 依存関係の更新: npm install
- サーバ起動: npm start
- ffmpeg ダウンロード（Linux）: npm run setup

