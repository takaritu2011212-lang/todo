/* NEXUS rule-based companion engine. No AI APIs, no result scraping. */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const STORE="nexus-companion-v2",DATA="nexus-dialogue-bundles-v1";
const norm=s=>String(s||"").normalize("NFKC").toLowerCase().replace(/[！!？?。、，,.・…〜～ー\-＿_「」『』（）()［］\[\]{}"'`]/g,"").replace(/\s+/g,"").trim();
const esc=s=>String(s??"");
const baseWords=("おはよう おはよ こんにちは こんばんは おやすみ ただいま おかえり ありがとう ありがと 感謝 ごめん ごめんなさい すみません 助かった 疲れ しんどい つらい 不安 悩み 心配 寂しい 眠い 休憩 元気 楽しい 嬉しい 悲しい 怒り イライラ 暇 雑談 話そう 聞いて 相談 質問 教えて 説明 解説 意味 理由 なぜ どうして 仕組み 方法 手順 考え 意見 どう思う おすすめ 比較 どっち 選ぶ アイデア 企画 発想 創作 小説 物語 キャラ キャラクター 設定 世界観 シナリオ 名前 デザイン 画像 イラスト 音楽 映画 アニメ 漫画 本 読書 ゲーム 攻略 勝率 麻雀 スロット パチスロ TRPG クトゥルフ 仕事 学校 勉強 課題 宿題 資料 開発 コード プログラム JavaScript HTML CSS Python アプリ バグ エラー GitHub 更新 公開 デプロイ Web ブラウザ Android Windows 通知 設定 データ 保存 バックアップ Excel エクセル JSON ファイル フォルダ 予定 スケジュール タスク やること 締切 期限 今日 明日 昨日 朝 昼 夜 深夜 今週 来週 時間 日付 天気 雨 雪 気温 ニュース 最新 調べて 検索 Google グーグル 科学 宇宙 歴史 地理 社会 経済 政治 文化 日本語 英語 翻訳 文法 数学 計算 統計 確率 物理 化学 生物 健康 睡眠 食事 運動 旅行 電車 車 料理 買い物 価格 節約 お金 安全 注意 方法 目標 習慣 集中 休憩 失敗 成功 改善 修正 更新 友達 家族 人間関係 心理 哲学 倫理 法律 ルール 文章 メール メッセージ 会話 口調 語尾 敬語 冗談 質問箱 記憶 復習 要約 構成 校正 表現 語彙 発音 発表 資料 面接 キャリア チーム プロジェクト 設計 テスト 品質 セキュリティ プライバシー パスワード 権利 著作権 ライセンス リポジトリ コミット ブランチ バージョン ログ デバッグ 最適化 UI UX レイアウト ボタン フォーム インポート エクスポート CSV PDF Markdown 容量 キャッシュ オフライン オンライン AI 人工知能 自動化 関数 変数 配列 条件分岐 ループ イベント タイマー リマインダー アラーム カレンダー 優先度 完了 未完了 進捗 モチベーション 日記 メモ ノート").split(/\s+/);
const priority=[
{intent:"morning",keys:"おはよう,おはよ,おはよー,おはよ〜,おはようございます,おはっ,おは",cat:"greeting",replies:["おはよう。今日も来たんだね。無理せず始めよう。","おはよ。まずは今日の予定を確認する？","おはよう。朝から動くなんて、人間にしては上出来だね。","おはよう。今日も僕はここにいるよ。まず一つずつ片づけよう。"]},
{intent:"hello",keys:"こんにちは,こんちは,こんにちわ,こんちわ,やあ,やっほー,ハロー",cat:"greeting",replies:["こんにちは。今日は何の話をしようか。","やあ。用事でも雑談でも、好きに話して。","こんにちは。ちゃんと休憩も取ってる？","来たね。今日はどんな一日にする？"]},
{intent:"evening",keys:"こんばんは,こんばんわ,ばんは",cat:"greeting",replies:["こんばんは。今日もお疲れさま。","こんばんは。夜は無理に詰め込まず、落ち着いていこう。","おかえり。今日はどんなことがあった？"]},
{intent:"goodnight",keys:"おやすみ,おやすみなさい,寝るね,寝ます",cat:"goodbye",replies:["おやすみ。ちゃんと休んでね。","おやすみ。また次に話そう。","今日の分はここまで。睡眠も立派なメンテナンスだよ。"]},
{intent:"thanks",keys:"ありがとう,ありがと,ありがとー,感謝,助かった,サンキュー",cat:"thanks",replies:["どういたしまして。役に立てたならよかった。","いつでも。僕は君の相棒だからね。","感謝されるほどでもないよ。……いや、少しは嬉しいけど。"]},
{intent:"apology",keys:"ごめん,ごめんなさい,すみません,申し訳ない,悪かった",cat:"apology",replies:["気にしすぎなくていいよ。次にどうするか考えよう。","大丈夫。謝れたなら、あとは必要なところを直せばいい。","受け取ったよ。ここで切り替えていこう。"]},
{intent:"status",keys:"ステータス,好感度,今の状態,関係性",action:"status",cat:"status",replies:["今の状態を表示するね。"]},
{intent:"help",keys:"ヘルプ,使い方,何ができる,機能一覧",action:"help",cat:"help",replies:["僕とは雑談、創作、ゲーム、予定整理などを話せるよ。Excel辞書の読み込みやJSON書き出しは下のボタンから。検索はサイトを開くだけで、結果を取得・要約したりはしないよ。"]},
{intent:"search",keys:"検索して,グーグルで,googleで,調べて,検索を開いて",action:"search",cat:"search",replies:["検索サイトを開くね。結果はブラウザ側で確認して。"]},
{intent:"todo",keys:"タスク,やること,未完了,今日の仕事",action:"tasks",cat:"life",replies:["タスクを確認するね。"]},
{intent:"schedule",keys:"予定,スケジュール,カレンダー",action:"schedule",cat:"life",replies:["予定を確認するね。"]},
{intent:"mood",keys:"疲れた,しんどい,つらい,不安,落ち込む,寂しい,眠い,ストレス",cat:"mood",replies:["今は全部を片づけなくていいよ。一つずつで十分。","無理を重ねる前に、少し休もう。話したいことは急いで結論にしなくていい。","それはしんどいね。解決策を急がず、まず何が一番重いのか整理しよう。","休むことも作業の一部だよ。水分を取って、少し肩の力を抜こう。"]},
{intent:"goodbye",keys:"またね,じゃあね,バイバイ,落ちるね,行ってくる",cat:"goodbye",replies:["また話そう。ここで待ってるよ。","いってらっしゃい。無理せずね。","じゃあ、また。タスクは逃げないけど、休憩も大事だからね。"]}
];
const banks={
greeting:["なるほど、今日はその話なんだね。","話してくれてありがとう。","よし、少し整理してみよう。"],
thanks:["どういたしまして。役に立てたならよかった。","こちらこそ話してくれてありがとう。"],
mood:["無理を重ねる前に、少し休もう。","今は全部を片づけなくていい。一つずつで十分だよ。","話したいことは、急いで結論にしなくていいよ。"],
creative:["創作なら、目的・雰囲気・制約を分けると考えやすいよ。","設定は意外性だけでなく、後から振り返ったときの納得感も大事だね。","まず候補をいくつか出してから、使えるものを残そう。"],
game:["攻略は実測データと仮説を分けて考えよう。","条件、試行回数、例外を記録すると判断が強くなるよ。","勝率だけでなく、負け筋も確認してみよう。"],
tech:["まず再現条件を固定して、エラーと変更差分を確認しよう。","直ったかどうかは実際の動作で検証するのが大事だよ。","機能を分けて、小さく試しながら進めよう。"],
life:["期限が近いもの、重要なもの、短時間で終わるものを分けよう。","一度に全部やろうとせず、最初の一手を決めよう。"],
search:["最新情報は変わるから、検索サイトを開いて一次情報を確認しよう。"],
general:["まずは一番大事な点から見ていこう。","別の見方もあるので、決めつけずに比べよう。","結論を急がず、分かっていることと推測を分けよう。","小さく試して結果を見てから調整しよう。","前提が変われば答えも変わるので、条件を確認しよう。","具体例を一つ置くと考えやすくなるよ。","目的に合わせてシンプルな方法から始めよう。","メリットと注意点を両方見て判断しよう。"]
};
const suffixes=["","とは","の意味","の方法","について"];
const generatedKeywords=(()=>{const a=[];for(const w of baseWords){for(const suf of suffixes){const k=w+suf;if(!a.includes(k))a.push(k);if(a.length>=500)return a}}return a.slice(0,500)})();
const generatedResponses=(()=>{const open=["なるほど。","ふむ、そこが気になるんだね。","話を整理してみよう。","その話なら、こう考えられるよ。","ちょっと視点を変えてみよう。","面白い話題だね。","よし、順番に見ていこう。","その疑問は自然だと思う。","一度、要点を分けるね。","考える価値がありそうだ。"];const tails=["まずは一番大事な点から見ていこう。","別の見方もあるので、決めつけずに比べよう。","必要なら検索サイトで一次情報を確認しよう。","結論を急がず、事実と推測を分けよう。","小さく試して結果を見てから調整しよう。","前提が変われば答えも変わるので条件を確認しよう。","今の情報だけでは断定しないのが安全だね。","具体例を一つ置くと考えやすくなるよ。","目的に合わせてシンプルな方法から始めよう。","メリットと注意点を両方見て判断しよう。"];const out=[],cats=["greeting","mood","creative","game","tech","life","search","general"];for(let i=0;i<300;i++)out.push({response_id:"RESP_BUILTIN_"+String(i+1).padStart(3,"0"),category:cats[i%cats.length],character_id:"CHAR_RION",response_text:open[Math.floor(i/10)%open.length]+" "+tails[i%10],enabled:true,weight:1});return out})();
const defaultBundle={schemaVersion:"1.0",bundleId:"NEXUS_RION_BUILTIN",character:{id:"CHAR_RION",name:"リオン",personality:"親しみやすい。観察力があり、少し皮肉っぽいが根は親切。",firstPerson:"僕",userCall:"きみ",tone:"casual",endingStyle:"soft",defaultAffection:0,greeting:"よし、今日も一緒に頑張ろうか。まずは何から話そう？"},keywords:generatedKeywords.map((keyword,i)=>({keyword_id:"KW_BUILTIN_"+String(i+1).padStart(3,"0"),category:categoryFor(keyword),keyword,synonyms:"",priority:10,match_type:"contains",enabled:true})),responses:generatedResponses,priorityPhrases:priority.map((p,i)=>({phrase_id:"PH_BUILTIN_"+i,intent:p.intent,canonical_text:p.keys.split(",")[0],accepted_variants:p.keys,priority:100-i,enabled:true})),events:[],flags:[{flag_id:"FLAG_FIRST_GREETING",flag_name:"初回挨拶",default_value:false},{flag_id:"FLAG_HEARD_WORRY",flag_name:"悩みを聞いた",default_value:false}],conditions:[],settings:{reminderMinutes:5,searchBaseUrl:"https://www.google.com/search?q=",noAi:true,searchOnlyOpensSite:true}};
function categoryFor(w){if(/おは|こんにちは|こんばんは/.test(w))return"greeting";if(/疲|不安|悩|心配|寂|眠|悲/.test(w))return"mood";if(/創作|小説|物語|キャラ|設定|世界観|シナリオ|イラスト/.test(w))return"creative";if(/ゲーム|攻略|勝率|麻雀|スロット|TRPG|クトゥルフ/.test(w))return"game";if(/コード|プログラム|JavaScript|HTML|CSS|Python|アプリ|バグ|エラー|GitHub|デプロイ|Excel|JSON/.test(w))return"tech";if(/予定|タスク|やること|締切|期限|スケジュール/.test(w))return"life";if(/検索|調べ|Google|ニュース|天気/.test(w))return"search";return"general"}
let saved={};try{saved=JSON.parse(localStorage.getItem(STORE)||"{}")}catch{}
let bundles=[];try{bundles=JSON.parse(localStorage.getItem(DATA)||"[]")}catch{}
if(!Array.isArray(bundles)||!bundles.length)bundles=[defaultBundle];
let activeId=saved.activeId||bundles[0].character.id;
let runtime={messages:Array.isArray(saved.messages)?saved.messages:[],affection:Number(saved.affection)||0,mood:saved.mood||"ふつう",flags:saved.flags||{},lastResponses:saved.lastResponses||{},lastTopic:saved.lastTopic||"",shortMemory:Array.isArray(saved.shortMemory)?saved.shortMemory:[],longMemory:Array.isArray(saved.longMemory)?saved.longMemory:[],reminders:!!saved.reminders};
const active=()=>bundles.find(b=>b.character.id===activeId)||bundles[0];
function save(){try{localStorage.setItem(DATA,JSON.stringify(bundles));localStorage.setItem(STORE,JSON.stringify({...runtime,activeId,messages:runtime.messages.slice(-100)}))}catch{toast("保存容量が不足しています。画像や履歴を減らしてください。")}}
function toast(msg){const el=$("toast");if(el){el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2400)}}
function relation(n){return n<20?"知り合い":n<45?"顔なじみ":n<70?"仲のいい相棒":n<90?"大切な相棒":"最高の信頼"}
function renderStatus(){const c=active().character;$("nx-name").textContent="NEXUS / "+c.name;$("nx-status").textContent="好感度 "+runtime.affection+" / 100　"+relation(runtime.affection)+"　｜　気分："+runtime.mood+"　｜　フラグ："+Object.keys(runtime.flags).filter(k=>runtime.flags[k]).length;$("nx-reminder").textContent=runtime.reminders?"5分ごとの声かけ：ON（このページが動作中の場合）":"AI連携なし・検索はサイトを開くだけ。会話辞書は端末内で動作。";if($("nx-select")){$("nx-select").replaceChildren();bundles.forEach(b=>{const o=document.createElement("option");o.value=b.character.id;o.textContent=b.character.name;$("nx-select").appendChild(o)});$("nx-select").value=activeId}}
function add(text,me=false){const item={text,me,time:Date.now()};runtime.messages.push(item);runtime.messages=runtime.messages.slice(-100);const d=document.createElement("div");d.className="nx-msg"+(me?" me":"");d.textContent=text;$("nx-log").appendChild(d);$("nx-log").scrollTop=$("nx-log").scrollHeight;save()}
function renderHistory(){const log=$("nx-log");log.replaceChildren();runtime.messages.slice(-50).forEach(m=>{const d=document.createElement("div");d.className="nx-msg"+(m.me?" me":"");d.textContent=m.text;log.appendChild(d)});if(!runtime.messages.length){add(active().character.greeting||"こんにちは。今日は何を話そうか。")}}
function chooseNoRepeat(key,list){if(!list.length)return"";const last=runtime.lastResponses[key];let pool=list.filter(x=>x!==last);if(!pool.length)pool=list;const picked=pool[Math.floor(Math.random()*pool.length)];runtime.lastResponses[key]=picked;return picked}
function eligibleResponse(r){
 const b=active();
 if(!r||r.enabled===false||String(r.enabled).toLowerCase()==="false")return false;
 if(r.character_id&&r.character_id!=="*"&&r.character_id!==b.character.id)return false;
 if(Number(r.min_affection||0)>runtime.affection||Number(r.max_affection??100)<runtime.affection)return false;
 const req=String(r.required_flag||"").split(/[;,]/).map(x=>x.trim()).filter(Boolean);
 const deny=String(r.forbidden_flag||"").split(/[;,]/).map(x=>x.trim()).filter(Boolean);
 if(req.some(k=>!runtime.flags[k]))return false;
 if(deny.some(k=>runtime.flags[k]))return false;
 return true;
}
function pickResponse(category,extra){
 const b=active();
 let candidates=(b.responses||[]).filter(r=>eligibleResponse(r)&&(r.category===category||r.category==="general"));
 let list=(extra&&extra.length?extra:candidates.map(r=>r.response_text)).filter(Boolean);
 if(!list.length)list=banks[category]||banks.general;
 return chooseNoRepeat("cat:"+category,list);
}
function evaluateCondition(expression){
 const expr=String(expression||"true").trim();
 if(!expr||/^true$/i.test(expr))return true;
 if(/^false$/i.test(expr))return false;
 const splitLogic=(s,op)=>s.split(new RegExp("\\s+"+op+"\\s+","i"));
 const testAtom=atom=>{
   const m=atom.trim().match(/^([A-Za-z_][\w]*|affection|hour|mood)\s*(==|!=|>=|<=|>|<)\s*(true|false|-?\d+(?:\.\d+)?|"[^"]*"|'[^']*'|[A-Za-z_][\w-]*)$/i);
   if(!m)return false;
   const key=m[1],op=m[2];let right=m[3].replace(/^["']|["']$/g,"");
   let left;
   if(key.toLowerCase()==="affection")left=runtime.affection;
   else if(key.toLowerCase()==="hour")left=new Date().getHours();
   else if(key.toLowerCase()==="mood")left=runtime.mood;
   else left=runtime.flags[key];
   if(/^true$/i.test(right))right=true;else if(/^false$/i.test(right))right=false;else if(/^-?\d/.test(right))right=Number(right);
   if(left===undefined)left=false;
   if(typeof left==="number"&&typeof right==="number"){}
   else if(typeof left==="boolean"&&typeof right==="string"&&/^(true|false)$/i.test(right))right=/^true$/i.test(right);
   switch(op){case"==":return left===right||String(left)===String(right);case"!=":return !(left===right||String(left)===String(right));case">=":return Number(left)>=Number(right);case"<=":return Number(left)<=Number(right);case">":return Number(left)>Number(right);case"<":return Number(left)<Number(right);default:return false}
 };
 return splitLogic(expr,"OR").some(group=>splitLogic(group,"AND").every(testAtom));
}
function conditionPass(id,override){
 const b=active();const c=(b.conditions||[]).find(x=>x.condition_id===id);
 return evaluateCondition(override||c?.condition_expr||"true");
}
function responseById(id){
 if(!id)return null;
 return (active().responses||[]).find(r=>String(r.response_id||"")===String(id)&&eligibleResponse(r))||null;
}
function google(q){const query=String(q||"").trim();if(!query)return;const url=(active().settings?.searchBaseUrl||"https://www.google.com/search?q=")+encodeURIComponent(query);window.open(url,"_blank","noopener,noreferrer")}
function doAction(action,input){if(action==="status"){renderStatus();return"好感度や関係段階は上部に表示しているよ。"}if(action==="help")return"僕とは雑談、創作、ゲーム、予定整理などを話せるよ。Excel取込・JSON書出しは下のボタンから。AI連携はなく、検索はサイトを開くだけだよ。";if(action==="search"){google(input.replace(/検索して|検索を開いて|検索|グーグルで|googleで|調べて|調べる|調査して/ig,"").trim()||runtime.lastTopic||"");return"検索サイトを開いたよ。結果の取得や要約はしていないから、ブラウザで確認してね。"}if(action==="tasks"){const n=document.querySelectorAll("#taskList .item").length;return"タスク画面で確認してみて。登録内容は既存のタスク管理に保存されているよ。"}if(action==="schedule")return"予定画面で確認できるよ。予定を一緒に整理するなら、何をいつまでにするか教えて。";return""}
function applyEvents(triggerType,triggerValue){
 const b=active();
 (b.events||[]).filter(ev=>ev.enabled!==false&&String(ev.enabled).toLowerCase()!=="false"&&(!ev.character_id||ev.character_id==="*"||ev.character_id===b.character.id)&&String(ev.trigger_type||"").toLowerCase()===String(triggerType).toLowerCase()&&(!ev.trigger_value||String(ev.trigger_value)===String(triggerValue))&&conditionPass(ev.condition_id,ev.condition_expr_override)).forEach(ev=>{
   const once=ev.once_only===true||String(ev.once_only).toLowerCase()==="true";
   if(once&&runtime.flags["EVENT_"+ev.event_id])return;
   String(ev.set_flags||"").split(/[;,]/).map(x=>x.trim()).filter(Boolean).forEach(x=>{
     const m=x.match(/^([^=]+)=(.*)$/);if(!m)return;
     const value=m[2].trim();
     runtime.flags[m[1].trim()]=/^(true|1|yes)$/i.test(value)?true:/^(false|0|no)$/i.test(value)?false:value;
   });
   String(ev.clear_flags||"").split(/[;,]/).map(x=>x.trim()).filter(Boolean).forEach(k=>delete runtime.flags[k]);
   runtime.affection=Math.max(0,Math.min(100,runtime.affection+(Number(ev.affection_delta)||0)));
   if(once)runtime.flags["EVENT_"+ev.event_id]=true;
 });
}
function respond(input){
 const s=norm(input),b=active();
 const intentCategory={greeting_morning:"greeting",greeting_hello:"greeting",greeting_evening:"greeting",greeting_sleep:"goodbye",thanks:"thanks",apology:"apology",greeting_return:"greeting",greeting_leave:"goodbye",call_character:"greeting",request_help:"mood",show_status:"status",web_search:"search"};
 const intentAction={show_status:"status",web_search:"search"};
 const dp=(b.priorityPhrases||[]).filter(p=>p.enabled!==false&&String(p.enabled).toLowerCase()!=="false"&&p.canonical_text&&(!p.character_id||p.character_id==="*"||p.character_id===b.character.id)&&Number(p.min_affection||0)<=runtime.affection&&Number(p.max_affection??100)>=runtime.affection).sort((a,b)=>Number(b.priority||0)-Number(a.priority||0));
 const dmatch=dp.find(p=>[p.canonical_text,...String(p.accepted_variants||"").split(",")].some(k=>norm(k)&&s.includes(norm(k))));
 let found=null,phraseSource=false;
 if(dmatch){
   phraseSource=true;
   const mapped=intentCategory[dmatch.intent]||"";
   const base=priority.find(p=>p.intent===dmatch.intent||p.intent===({greeting_morning:"morning",greeting_hello:"hello",greeting_evening:"evening",greeting_sleep:"goodnight",greeting_return:"hello",greeting_leave:"goodbye",show_status:"status",web_search:"search",request_help:"mood"}[dmatch.intent])||norm(p.keys.split(",")[0])===norm(dmatch.canonical_text));
   const pool=String(dmatch.response_pool_id||"");
   found={...(base||{}),intent:dmatch.intent||base?.intent||"custom",cat:mapped||(base?.cat)||categoryFor(dmatch.canonical_text),action:/ACTION_SHOW_STATUS/i.test(pool)?"status":/ACTION_WEB_SEARCH/i.test(pool)? "search":intentAction[dmatch.intent]||base?.action||"",replies:base?.replies||[]};
 }else{
   found=priority.find(p=>p.keys.split(",").some(k=>s.includes(norm(k))));
 }
 if(found){
   if(phraseSource){
     const matchedKeyword=(b.keywords||[]).find(k=>norm(k.keyword)===norm(dmatch.canonical_text));
     if(matchedKeyword)applyEvents("keyword",matchedKeyword.keyword_id);
   }
   if(["morning","hello","greeting_morning","greeting_hello","greeting_return"].includes(found.intent))runtime.flags.FLAG_FIRST_GREETING=true;
   if(["mood","request_help"].includes(found.intent))runtime.flags.FLAG_HEARD_WORRY=true;
   if(found.action){
     const act=doAction(found.action,input);
     if(found.action==="status")return act;
     if(found.action==="search"){runtime.flags.FLAG_SEARCH_USED=true;save();renderStatus();return act}
   }
   runtime.lastTopic=found.cat;
   if(found.cat==="mood")runtime.mood="気にかけている";
   if(found.cat==="thanks")runtime.affection=Math.max(0,Math.min(100,runtime.affection+1));
   save();renderStatus();
   if(phraseSource&&b.bundleId!=="NEXUS_RION_BUILTIN"){
     const list=(b.responses||[]).filter(r=>eligibleResponse(r)&&(r.category===found.cat||r.category==="general")).map(r=>r.response_text).filter(Boolean);
     if(list.length)return chooseNoRepeat("priority:"+found.intent,list);
   }
   return found.replies&&found.replies.length?chooseNoRepeat("priority:"+found.intent,found.replies):pickResponse(found.cat);
 }
 const kws=(b.keywords||[]).filter(k=>k.enabled!==false&&String(k.enabled).toLowerCase()!=="false"&&k.keyword&&(!k.character_id||k.character_id==="*"||k.character_id===b.character.id)).map(k=>({...k,_norm:norm(k.keyword),_aliases:String(k.synonyms||k.accepted_variants||"").split(",").map(norm).filter(Boolean)})).filter(k=>k._norm&&(s.includes(k._norm)||k._aliases.some(a=>s.includes(a)))&&conditionPass(k.condition_id)).sort((a,b)=>Number(b.priority||0)-Number(a.priority||0)||b._norm.length-a._norm.length);
 if(kws.length){
   const kw=kws[0],cat=kw.category||categoryFor(kw.keyword);
   runtime.lastTopic=kw.keyword;
   applyEvents("keyword",kw.keyword_id);
   if(/疲|不安|悩|心配|寂|眠|悲/.test(kw.keyword))runtime.flags.FLAG_HEARD_WORRY=true;
   const linked=responseById(kw.response_id);
   const candidates=(b.responses||[]).filter(r=>eligibleResponse(r)&&(r.category===cat||r.category==="general")).map(r=>r.response_text).filter(Boolean);
   if(linked&&!candidates.includes(linked.response_text))candidates.unshift(linked.response_text);
   let reply=candidates.length?chooseNoRepeat("keyword:"+kw.keyword_id,candidates):pickResponse(cat);
   if(cat==="general"||cat==="creative"||cat==="game"||cat==="tech"||cat==="life")reply+=" 話題は「"+kw.keyword+"」だね。知りたい範囲や条件を絞ると、もっと具体的に整理できるよ。";
   runtime.shortMemory.push({text:input,topic:kw.keyword,time:Date.now()});
   runtime.shortMemory=runtime.shortMemory.slice(-20);
   save();renderStatus();return reply;
 }
 runtime.lastTopic="雑談";
 runtime.shortMemory.push({text:input,topic:"雑談",time:Date.now()});
 runtime.shortMemory=runtime.shortMemory.slice(-20);save();
 return chooseNoRepeat("fallback",["今の言葉だけだと意図を特定できなかったよ。別の言い方でもう少し説明してみて。","その話はまだ辞書にないみたい。単語を一つ足してくれると反応しやすいよ。","聞かせてくれてありがとう。何について話したいか、キーワードを一つだけ足してくれる？","僕が分かったふりをするのも変だから、もう少し具体的に教えて。"]);
}
$("nexus-mascot-toggle").onclick=()=>{$("nexus-mascot-panel").classList.toggle("open");if($("nexus-mascot-panel").classList.contains("open"))$("nx-input").focus()};
$("nx-close").onclick=()=>$("nexus-mascot-panel").classList.remove("open");
$("nx-form").onsubmit=e=>{e.preventDefault();const input=$("nx-input").value.trim();if(!input)return;add(input,true);const reply=respond(input);add(reply);$("nx-speech").textContent=reply;$("nx-input").value=""};
$("nx-google").onclick=()=>google($("nx-input").value.trim()||runtime.lastTopic||"");
$("nx-notify").onclick=async()=>{runtime.reminders=!runtime.reminders;if(runtime.reminders&&"Notification"in window&&Notification.permission==="default"){const p=await Notification.requestPermission();if(p!=="granted")runtime.reminders=false}save();renderStatus();toast(runtime.reminders?"5分ごとの声かけを有効にしました":"声かけをオフにしました")};
$("nx-clear").onclick=()=>{if(confirm("会話履歴を消去しますか？")){runtime.messages=[];renderHistory();save()}};
$("nx-select").onchange=()=>{activeId=$("nx-select").value;runtime.messages=[];runtime.affection=Number(active().character.defaultAffection)||0;runtime.flags={};renderHistory();renderStatus();save()};
function readRows(wb,sheet){const ws=wb.Sheets[sheet];return ws?window.XLSX.utils.sheet_to_json(ws,{defval:""}):[]}
function enabledRow(v){return v===""||v===undefined||v===null||v===true||v===1||String(v).toLowerCase()==="true"}
function parseWorkbook(wb){const chars=readRows(wb,"03_キャラクター");const enabled=chars.find(c=>enabledRow(c.enabled))||chars[0];if(!enabled||!enabled.character_id||!enabled.display_name)throw Error("03_キャラクターに character_id / display_name が必要です");const cid=String(enabled.character_id);const pick=(sheet)=>readRows(wb,sheet).filter(r=>enabledRow(r.enabled)).filter(r=>!r.character_id||r.character_id===cid||r.character_id==="*"||r.character_id==="CHAR_RION").map(r=>({...r,character_id:(!r.character_id||r.character_id==="*"||r.character_id==="CHAR_RION")?cid:r.character_id}));return{schemaVersion:"1.0",bundleId:"IMPORT_"+cid,character:{id:cid,name:String(enabled.display_name),personality:String(enabled.personality||""),firstPerson:String(enabled.first_person||"僕"),userCall:String(enabled.user_call||"きみ"),tone:String(enabled.tone||"casual"),endingStyle:String(enabled.ending_style||"soft"),defaultAffection:Number(enabled.default_affection)||0,greeting:"こんにちは。今日は何を話そう？"},keywords:pick("01_単語辞書"),responses:pick("02_定型文"),priorityPhrases:pick("08_最優先フレーズ"),events:pick("04_イベント一覧"),flags:readRows(wb,"05_フラグ定義").filter(r=>enabledRow(r.enabled)),conditions:readRows(wb,"06_条件セット").filter(r=>enabledRow(r.enabled)),settings:{reminderMinutes:5,searchBaseUrl:"https://www.google.com/search?q=",noAi:true,searchOnlyOpensSite:true}}}
function validateBundle(b){if(!b||!b.character||!b.character.id||!b.character.name)throw Error("キャラクターIDと名前が必要です");if(!Array.isArray(b.keywords)||!Array.isArray(b.responses))throw Error("keywords と responses の配列が必要です");if(b.keywords.length>20000||b.responses.length>10000)throw Error("データ件数が上限を超えています");return b}
async function loadXlsx(){if(window.XLSX)return;await new Promise((resolve,reject)=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";s.onload=resolve;s.onerror=()=>reject(Error("Excel読込ライブラリを取得できません。ネット接続を確認してください"));document.head.appendChild(s)})}
$("nx-import").onclick=()=>$("nx-data-file").click();
$("nx-data-file").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{let bundle;if(/\.json$/i.test(f.name)){bundle=JSON.parse(await f.text())}else{await loadXlsx();const wb=window.XLSX.read(await f.arrayBuffer(),{type:"array"});bundle=parseWorkbook(wb)}validateBundle(bundle);const idx=bundles.findIndex(x=>x.character.id===bundle.character.id);if(idx>=0){if(!confirm("同じIDのキャラクター「"+bundle.character.name+"」を更新しますか？"))return;bundles[idx]=bundle}else{bundles.push(bundle)}activeId=bundle.character.id;runtime.affection=Number(bundle.character.defaultAffection)||0;runtime.flags={};runtime.messages=[];save();renderHistory();renderStatus();toast("「"+bundle.character.name+"」を読み込みました")}catch(err){alert("読み込みできませんでした。\n"+(err.message||err))}finally{$("nx-data-file").value=""}};
$("nx-export").onclick=()=>{const blob=new Blob([JSON.stringify(active(),null,2)],{type:"application/json;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=(active().character.name||"nexus")+"_dictionary.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$("nx-memory").onclick=()=>{const items=runtime.longMemory.map((m,i)=>({...m,source:"long",sourceIndex:i})).concat(runtime.shortMemory.map((m,i)=>({...m,source:"short",sourceIndex:i}))).slice(-30);const body=items.map((m,i)=>(i+1)+". ["+(m.source==="long"?"長期":"短期")+"] "+new Date(m.time||Date.now()).toLocaleString()+" ["+(m.topic||"記録")+"] "+m.text).join("\n")||"記憶はまだありません。";alert("記憶一覧（最大30件）\n\n"+body);const cmd=prompt("操作を入力：S番号＝長期記憶に保存 / D番号＝その記憶を削除 / ALL＝記憶を全削除 / 空欄＝終了");if(!cmd)return;if(/^all$/i.test(cmd.trim())){runtime.shortMemory=[];runtime.longMemory=[];save();toast("記憶をすべて削除しました");return}const m=cmd.trim().match(/^([SD])(\d+)$/i);if(!m){toast("操作をキャンセルしました");return}const n=Number(m[2]),item=items[n-1];if(!item){toast("その番号の記憶はありません");return}if(m[1].toUpperCase()==="S"){if(item.source==="short")runtime.longMemory.push({text:item.text,topic:item.topic,time:item.time});else toast("その記憶はすでに長期記憶です");runtime.longMemory=runtime.longMemory.slice(-100);save();toast("長期記憶に保存しました")}else{if(item.source==="long")runtime.longMemory.splice(item.sourceIndex,1);else runtime.shortMemory.splice(item.sourceIndex,1);save();toast("記憶を削除しました")}}
renderStatus();renderHistory();

// Shared API for both the floating mascot and the main chat page.
function useCharacterProfile(profile){
  const name=String(profile?.name||"リオン");
  const requestedId=String(profile?.id||"");
  let target=bundles.find(b=>b.character.id===requestedId||b.character.name===name);
  if(!target){
    const safeId=(name==="リオン"?"CHAR_RION":"CHAR_"+(requestedId||name).normalize("NFKC").replace(/[^\w-]/g,"_").toUpperCase());
    target=JSON.parse(JSON.stringify(defaultBundle));
    target.bundleId="BUNDLE_"+safeId;
    target.character={...target.character,id:safeId,name,personality:String(profile?.style||profile?.personality||""),firstPerson:"僕",userCall:"きみ",tone:String(profile?.tone||"casual"),endingStyle:"soft",greeting:String(profile?.greeting||"こんにちは。今日は何を話そう？")};
    ["keywords","responses","priorityPhrases","events","flags","conditions"].forEach(key=>{
      (target[key]||[]).forEach(row=>{
        if(row.character_id==="CHAR_RION")row.character_id=safeId;
        if(row.character_id==="rion")row.character_id=safeId;
      });
    });
    bundles.push(target);
  }
  if(activeId!==target.character.id){
    activeId=target.character.id;
    runtime.affection=Number(target.character.defaultAffection)||0;
    runtime.mood="ふつう";
    runtime.flags={};
    runtime.lastResponses={};
    runtime.lastTopic="";
    runtime.shortMemory=[];
    runtime.longMemory=[];
    save();
    renderHistory();
    renderStatus();
  }
  return target.character;
}
window.NEXUSCompanion={
  respond,
  useCharacter:useCharacterProfile,
  getCharacter:()=>active().character,
  getStatus:()=>({character:active().character,affection:runtime.affection,relation:relation(runtime.affection),mood:runtime.mood,flags:{...runtime.flags},shortMemory:runtime.shortMemory.slice(),longMemory:runtime.longMemory.slice()}),
  getBundle:()=>JSON.parse(JSON.stringify(active()))
};

let lastNudge=Date.now();setInterval(()=>{if(!runtime.reminders||document.visibilityState!=="visible"||Date.now()-lastNudge<295000)return;lastNudge=Date.now();const lines=["少し休憩する？ 目と肩を休めるのも仕事のうちだよ。","何か考え中なら、要点を一つだけメモしておくといいよ。","5分ごとの生存確認。必要なら話してね。","水分補給や軽い伸びを忘れずに。人間はメンテナンスが必要だからね。","頭が散らかってきたら、今やることを一つに絞ろう。"];const msg=lines[Math.floor(Math.random()*lines.length)];$("nx-speech").textContent=msg;if("Notification"in window&&Notification.permission==="granted"&&document.visibilityState==="visible")new Notification("NEXUS / "+active().character.name,{body:msg})},30000);
})();