# LUMIRIZE Website (Cursor Ops)

## 目的
GitHub Pagesで動く静的サイトとして、公式サイトを高品質に保ちながら改善する。

## 重要ルール（必ず守る）
- ビルド不要：純HTML/CSS/JSのみ
- 編集対象は原則3ファイル：index.html / styles.css / script.js
- 画像パスは直下固定：scene_gate.jpg / scene_key.jpg
- ロゴ（存在する場合）：logo-horizontal.png / logo-mark.png をヘッダー＆フッターで表示
- cinematicの必須クラス/IDは固定：
  - #story
  - .cinematic__img[data-scene]
  - .cinematic__block[data-scene]
- 会社概要（CONTACT内）は指定順で固定：
  1. 設立: 2021年8月24日
  2. 株式会社ルミライズ 代表取締役CEO 田中 秀泰
  3. 〒252-0237
  4. 神奈川県相模原市中央区千代田3-3-20
  5. TEL.042-704-8308 FAX.042-707-0392
  6. E-mail info@lumirize.com

## 検収チェック（PR/Commit前に必ず確認）
- iPhone Safariでレイアウト崩れなし
- cinematic中の文字が画像の後ろに回らない（z-index）
- telリンク / mailtoフォーム / ナビが動く
# LUMIRIZE Website (Cursor Ops)

## 必須ルール
- このリポジトリは静的サイト（GitHub Pages/RawGitHack）で動かす。ビルド不要。
- 画像パスは直下固定：scene_gate.jpg / scene_key.jpg
- ロゴ：logo-horizontal.png / logo-mark.png があれば使用（ヘッダー/フッター）
- 変更は index.html / styles.css / script.js に限定（原則、ファイル追加しない）
- CinematicのID/クラス名は固定：#story, .cinematic__img[data-scene], .cinematic__block[data-scene]
- 会社概要（Contact内）は指定順で固定

## 検収チェック
- iPhone Safariでレイアウト崩れなし
- Cinematic中の文字が画像の後ろに回らない（z-index）
- tel/mailto/ナビが動く

## Cinematicデバッグモード
- `/index.html?debug=1` で右下に診断HUDを表示（通常URLでは非表示）
# lumirize
株式会社ルミライズ

## 会社概要の表示順（固定）
今後の改修・別チャットでの更新時も、以下の順番を必ず維持してください。

1. 設立: 2021年8月24日
2. 株式会社ルミライズ 代表取締役CEO 田中 秀泰
3. 〒252-0237
4. 神奈川県相模原市中央区千代田3-3-20
5. TEL.042-704-8308 FAX.042-707-0392
6. E-mail info@lumirize.com
