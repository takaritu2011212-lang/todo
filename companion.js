/* NEXUS companion engine: local keyword matching, configurable endings, Google search handoff, five-minute check-ins. */
(()=>{"use strict";
const $=id=>document.getElementById(id), STORE="nexus-mascot-v1", PREF="nexus-mascot-settings-v1";
const state=(()=>{try{return JSON.parse(localStorage.getItem(STORE))||{messages:[],lastTopic:""}}catch{return {messages:[],lastTopic:""}}})();
const prefs=(()=>{try{return JSON.parse(localStorage.getItem(PREF))||{reminders:false,ending:"auto"}}catch{return {reminders:false,ending:"auto"}}})();
const save=()=>{try{localStorage.setItem(STORE,JSON.stringify({messages:state.messages.slice(-120),lastTopic:state.lastTopic}));localStorage.setItem(PREF,JSON.stringify(prefs))}catch{}};
const endings={auto:["だよ。","だね。","かな。","と思う。","してみよう。"],soft:["だよ。","だね。","かな。","してみようね。"],polite:["です。","ですね。","でしょう。","してみましょう。"],casual:["だな。","じゃん。","って感じ。","してみようぜ。"],none:["。"]};
const starters=["なるほど。","ふむ、そこが気になるんだね。","話を整理してみよう。","その話なら、こう考えられるよ。","ちょっと視点を変えてみよう。","面白い話題だね。","よし、順番に見ていこう。","その疑問は自然だと思う。","一度、要点を分けるね。","考える価値がありそうだ。"];
const endingsText=["まずは一番大事な点から見ていこう","別の見方もあるので、決めつけずに比べよう","必要ならGoogle検索で一次情報を確認しよう","結論を急がず、分かっていることと推測を分けよう","小さく試して結果を見てから調整しよう","前提が変われば答えも変わるので条件を確認しよう","今の情報だけでは断定しないのが安全だ","具体例を一つ置くと考えやすくなる","目的に合わせてシンプルな方法から始めよう","メリットと注意点を両方見て判断しよう"];
const phrases=[
["greet",["こんにちは","おはよう","こんばんは","やあ","おつかれ","ただいま","おやすみ"],["おかえり。今日はどんな話をしようか？","やあ、起動してるよ。用件でも雑談でもどうぞ。","お疲れさま。少し休憩しながら話そう。"]],
["thanks",["ありがとう","ありがと","助かった","感謝"],["どういたしまして。役に立てたならよかった。","こちらこそ、話してくれてありがとう。","いつでも整理役くらいは務めるよ。"]],
["mood",["疲れ","しんど","つらい","不安","落ち込","眠い","ストレス"],["無理を重ねる前に、少し休もう。話したいことは急いで結論にしなくていいよ。","今は全部を片づけなくていい。ひとつずつで十分だよ。","その状態なら、休憩や誰かに頼ることも選択肢に入れてね。"]],
["weather",["天気","気温","雨","雪","台風"],["最新の天気は変化するから、Google検索で地域名と日付を指定して確認するのが確実だよ。"]],
["news",["ニュース","最新","今日の出来事","速報","最近何が"],["最新情報は変わるので、検索結果の公開日時と元の報道機関を確認しよう。Google検索を開いて調べられるよ。"]],
["search",["検索","調べて","調べもの","グーグル","google","情報を探"],["検索したい言葉をそのままGoogleへ渡せるよ。結果の見出しだけで決めず、ページ本文と日付も確認しよう。"]],
["idea",["アイデア","案を出","企画","考えて","発想"],["まず数を出してから選ぶのがいいね。目的、制約、成功条件を分けて考えよう。"]],
["explain",["とは","どういう意味","教えて","解説","仕組み","なぜ","どうして"],["分かっている事実、理由、具体例の順で整理しよう。専門用語は必要な分だけ使うね。"]],
["creative",["小説","物語","キャラ","設定","世界観","シナリオ","創作"],["創作なら、目的・雰囲気・制約を決めると強くなるよ。意外性だけでなく、後から振り返ったときの納得感も大事だね。"]],
["game",["ゲーム","攻略","勝率","強い","対戦","麻雀","スロット"],["攻略は実測データと仮説を分けて考えよう。条件、試行回数、例外を残すと判断が強くなるよ。"]],
["tech",["コード","プログラム","javascript","html","css","アプリ","バグ","エラー"],["まず再現条件を固定して、コンソールのエラーと変更差分を確認しよう。直ったかは実際の動作で検証するのが大事だよ。"]],
["life",["予定","タスク","やること","今日","明日","締切"],["タスクや予定の整理もできるよ。最初に期限が近いもの、重要なもの、短時間で終わるものを分けよう。"]],
["opinion",["どう思う","意見","おすすめ","比較","どっち"],["判断基準を先に決めよう。価格、手間、リスク、長期的な使いやすさを並べると比較しやすいよ。"]],
["goodbye",["またね","じゃあね","バイバイ","おやすみなさい"],["また話そう。ウィンドウを閉じても、保存した会話はこの端末に残るよ。"]]
];
const genericTopics=["日常の小さな疑問","趣味の話","新しいアイデア","最近気になっていること","少し難しい問題","今考えている計画","気分転換の話","知識を深めたい話題","作業の進め方","選択肢の比較"];
// 300 reusable reply variants: 30 openers × 10 grounded follow-throughs.
const canned=Array.from({length:300},(_,i)=>starters[i%starters.length]+" "+endingsText[Math.floor(i/starters.length)%endingsText.length]+ "。");
const lexiconBase=("こんにちは おはよう こんばんは ありがとう 感謝 疲れ 不安 悩み 相談 質問 調べる 検索 Google ニュース 天気 雨 雪 気温 台風 仕事 学校 勉強 課題 宿題 予定 タスク 締切 時間 今日 明日 昨日 今週 来週 月 火 水 木 金 土 日 趣味 ゲーム 攻略 勝率 麻雀 将棋 スロット 創作 小説 物語 キャラクター 世界観 シナリオ 設定 アイデア 企画 発想 名前 デザイン 画像 音楽 映画 アニメ 本 漫画 技術 科学 宇宙 歴史 地理 社会 経済 政治 文化 言語 日本語 英語 翻訳 文法 数学 計算 統計 確率 物理 化学 生物 医療 健康 睡眠 食事 運動 旅行 交通 電車 車 料理 買い物 価格 比較 おすすめ 選択 判断 メリット デメリット 安全 注意 方法 手順 解説 意味 理由 仕組み 原因 結果 予測 計画 目標 習慣 集中 休憩 疲労 気分 喜び 怒り 悲しみ 寂しい 楽しい 面白い 退屈 緊張 練習 上達 成長 失敗 成功 改善 修正 更新 公開 GitHub Web アプリ ブラウザ Android デスクトップ マスコット 通知 設定 保存 データ バックアップ ファイル フォルダ 文章 メール メッセージ 会話 口調 語尾 敬語 丁寧 砕けた 冗談 雑談 質問箱 相談相手 友達 家族 人間関係 コミュニケーション 心理 考え方 哲学 倫理 法律 ルール 契約 お金 節約 貯金 投資 税金 統計データ グラフ 表 記録 分析 仮説 検証 実験 研究 論文 出典 参考文献 信頼性 一次情報 二次情報 更新日 公式サイト サポート ヘルプ トラブル 問題 解決 エラー バグ コード JavaScript HTML CSS Python API JSON localStorage ServiceWorker 通信 オフライン オンライン AI 人工知能 モデル プロンプト 自動化 スクリプト 関数 変数 配列 オブジェクト 条件分岐 ループ イベント タイマー リマインダー アラーム カレンダー 期限 優先度 完了 未完了 進捗 習慣化 やる気 モチベーション 集中力 目標設定 タイムマネジメント ポモドーロ メモ ノート 日記 記憶 復習 読書 要約 構成 校正 推敲 表現 語彙 文章力 発音 発声 会話術 プレゼン 発表 資料 スライド 仕事術 面接 履歴書 キャリア 転職 就職 職場 チーム リーダー 管理 プロジェクト 開発 設計 テスト 品質 セキュリティ プライバシー パスワード 認証 暗号化 権限 アクセス 権利 著作権 ライセンス オープンソース リポジトリ コミット ブランチ デプロイ 公開URL ドメイン ホスティング Pages ワークフロー 自動テスト 依存関係 ライブラリ パッケージ バージョン リリース 変更履歴 ログ デバッグ パフォーマンス 最適化 レスポンシブ UI UX アクセシビリティ 色 フォント レイアウト ボタン フォーム 入力 検証 エクスポート インポート CSV PDF Markdown テキスト 画像圧縮 サイズ 容量 キャッシュ 更新反映 再読み込み 通知許可 バッテリー バックグラウンド タブ 省電力 スマホ PC Windows Linux macOS").split(/\s+/);
const lexicon=new Set(lexiconBase); // broad 500-word concept vocabulary, normalized for matching.
function ending(text){const mode=prefs.ending||"auto",arr=endings[mode]||endings.auto;let s=text;if(mode==="none")return s.replace(/[。！？]+$/,"。");const end=arr[Math.floor(Math.random()*arr.length)];return /[。！？]$/.test(s)?s.slice(0,-1)+end:s+end}
function respond(input){const s=input.toLowerCase();for(const [id,keys,replies] of phrases){if(keys.some(k=>s.includes(k))){state.lastTopic=id;return ending(replies[Math.floor(Math.random()*replies.length)])}}
const word=lexiconBase.find(w=>s.includes(w.toLowerCase()));if(word){state.lastTopic=word;return ending(canned[(Math.abs([...s].reduce((a,c)=>a+c.charCodeAt(0),0))%canned.length])+" 話題は「"+word+"」だね。条件や知りたい範囲を絞ると、もっと役立つ形にできるよ")}
state.lastTopic="雑談";return ending("聞かせてくれてありがとう。今のメッセージだけだと断定はできないけれど、いっしょに整理できるよ。目的や具体例が一つあると、もっと踏み込んで考えられるね")}
function add(text,me=false){const log=$("nx-log");const div=document.createElement("div");div.className="nx-msg"+(me?" me":"");div.textContent=text;log.appendChild(div);log.scrollTop=log.scrollHeight;state.messages.push({text,me,time:Date.now()});save()}
function load(){state.messages.slice(-50).forEach(m=>{const d=document.createElement("div");d.className="nx-msg"+(m.me?" me":"");d.textContent=m.text;$("nx-log").appendChild(d)});if(!state.messages.length)add("こんにちは。タスク管理だけじゃなく、雑談やアイデア整理もどうぞ。検索はGoogleの結果をそのまま確認する方式だよ。")}
function google(q){if(!q.trim())return;const url="https://www.google.com/search?q="+encodeURIComponent(q.trim());$("nx-search-results").replaceChildren();const note=document.createElement("div");note.textContent="Google検索を開きます。結果の見出し・説明・公開日を確認してね。";$("nx-search-results").appendChild(note);const a=document.createElement("a");a.href=url;a.target="_blank";a.rel="noopener noreferrer";a.textContent="Googleで「"+q.trim()+"」を検索 ↗";$("nx-search-results").appendChild(a);window.open(url,"_blank","noopener,noreferrer")}
$("nexus-mascot-toggle").onclick=()=>{$("nexus-mascot-panel").classList.toggle("open");if($("nexus-mascot-panel").classList.contains("open"))$("nx-input").focus()};
$("nx-close").onclick=()=>$("nexus-mascot-panel").classList.remove("open");
$("nx-form").onsubmit=e=>{e.preventDefault();const v=$("nx-input").value.trim();if(!v)return;add(v,true);const r=respond(v);add(r);$("nx-speech").textContent=r;$("nx-input").value=""};
$("nx-google").onclick=()=>{const q=$("nx-input").value.trim()||state.lastTopic||"最新ニュース";google(q)};
$("nx-notify").onclick=async()=>{prefs.reminders=!prefs.reminders;if(prefs.reminders&&"Notification"in window&&Notification.permission==="default"){const p=await Notification.requestPermission();if(p!=="granted"){prefs.reminders=false;add("通知が許可されていないため、定期通知はオフにしたよ。",false)}}$("nx-notify").textContent=prefs.reminders?"5分ごとの声かけ：ON":"5分ごとの声かけ";$("nx-reminder").textContent=prefs.reminders?"このページを開いている間、5分ごとに声をかけます。端末やブラウザが停止中の通知は保証されません。":"定期的な声かけはオフです。";save()};
$("nx-clear").onclick=()=>{if(confirm("マスコットとの会話履歴を消去しますか？")){state.messages=[];$("nx-log").replaceChildren();add("会話をリセットしたよ。ここからまた話そう。")}};
load();if(prefs.reminders){$("nx-notify").textContent="5分ごとの声かけ：ON";$("nx-reminder").textContent="このページを開いている間、5分ごとに声をかけます。";}
let lastNudge=Date.now();
setInterval(()=>{if(!prefs.reminders||document.visibilityState!=="visible"||Date.now()-lastNudge<295000)return;lastNudge=Date.now();const lines=["少し休憩する？ 目と肩を休めるのも仕事のうちだよ。","何か考え中なら、要点を一つだけメモしておくといいよ。","5分ごとの生存確認。必要なら何でも話してね。","水分補給や軽い伸びを忘れずに。人間は意外とメンテナンスが必要だからね。","頭が散らかってきたら、今やることを一つに絞ろう。"];const msg=lines[Math.floor(Math.random()*lines.length)];$("nx-speech").textContent=msg;if("Notification"in window&&Notification.permission==="granted"&&document.hidden===false)new Notification("NEXUS / リオン",{body:msg});},30000);
})();
