/* Order Guard — Google Drive 백업 + 인보이스 읽기 스크립트 (v3)
   1) 아래 CLIENTS 의 '코드'를 길고 아무도 모르는 문장으로 바꾸세요.   형식:  '초대코드': '드라이브 폴더 이름'
   2) 인보이스 사진 읽기를 쓰려면: 프로젝트 설정(톱니바퀴) → 스크립트 속성 → ANTHROPIC_API_KEY 추가 (키는 코드에 적지 마세요)
   3) 배포 → 배포 관리 → 연필 → 버전: 새 버전 → 배포   (실행 계정: 나 / 액세스: 모든 사용자)
   * 이 파일에는 실제 코드를 적지 말고, 구글 스크립트 편집기 안에서만 적으세요. GitHub에 올리지 마세요.
*/
const CLIENTS = {
  'CHANGE-ME-owner-code': 'Order Guard Backup',
  'CHANGE-ME-test-code': 'Order Guard Backup (test)'
};
const MODEL = 'claude-sonnet-5-5';   // 인보이스 읽기에 쓰는 모델
const MAX_EXTRACT_PER_DAY = 40;      // 코드(고객)별 하루 최대 사용 횟수. 비용 폭주 방지

function folder_(name) { const it = DriveApp.getFoldersByName(name); return it.hasNext() ? it.next() : DriveApp.createFolder(name); }
function file_(f, name) { const it = f.getFilesByName(name); return it.hasNext() ? it.next() : null; }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function nameFor_(tok) { return (tok && Object.prototype.hasOwnProperty.call(CLIENTS, tok) && tok.indexOf('CHANGE-ME') !== 0) ? CLIENTS[tok] : null; }

// 앱 → 구글: 데이터 저장 / 인보이스 읽기
function doPost(e) {
  try {
    const b = JSON.parse(e.postData.contents);
    const name = nameFor_(b.token);
    if (!name) return out_({ ok: false, error: 'auth' });
    if (b.action === 'extract') return out_(extractInvoice_(b, name));
    const f = folder_(name), json = JSON.stringify(b.data);
    const cur = file_(f, 'current.json');
    if (cur) cur.setContent(json); else f.createFile('current.json', json, MimeType.PLAIN_TEXT);
    const day = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const snap = 'snapshot-' + day + '.json';
    if (!file_(f, snap)) f.createFile(snap, json, MimeType.PLAIN_TEXT);   // 하루 한 번 보관본
    return out_({ ok: true, at: Date.now() });
  } catch (err) { return out_({ ok: false, error: String(err) }); }
}

// 구글 → 앱: 복원용 읽기
function doGet(e) {
  const name = nameFor_(e.parameter && e.parameter.token);
  if (!name) return out_({ ok: false, error: 'auth' });
  const cur = file_(folder_(name), 'current.json');
  return out_({ ok: true, data: cur ? JSON.parse(cur.getBlob().getDataAsString()) : null });
}

/* ---------- 인보이스 사진 → 거래처·품목·수량 ---------- */
const PROMPT_ = [
  'You read photos of supplier invoices / delivery slips for a small restaurant and return structured data.',
  'Return ONLY one JSON object, no other text, in this exact shape:',
  '{"vendor":{"name":"","name_en":"","phone":""},"date":"YYYY-MM-DD","items":[{"name":"","name_en":"","qty":0,"unit":"","unit_price":null,"amount":null,"confidence":"high"}],"total":null,"notes":""}',
  'Rules:',
  '- vendor = the company that ISSUED the invoice (the seller), not the restaurant that is billed. Copy the name as printed.',
  '- name = item name exactly as printed (Korean stays Korean). name_en = a short English translation, or "" if unsure.',
  '- qty = the billed quantity (the number that is multiplied by the unit price). unit = the unit as printed (box, case, lb, 박스, 포대...) or "".',
  '- unit_price and amount are numbers in dollars without symbols; null if not shown or unreadable.',
  '- confidence is "low" for any line that is handwritten, blurry, cut off, or where you are guessing; otherwise "high".',
  '- Skip tax, shipping, deposit and total lines in items. Put the grand total in total. Mention skipped charges in notes.',
  '- Never invent items or numbers. If a value is unreadable use null (or "" for text).',
  '- date: the invoice date as YYYY-MM-DD. If the year is missing use the current year given below. If unreadable use "".'
].join('\n');

function extractInvoice_(b, folderName) {
  const props = PropertiesService.getScriptProperties();
  const key = props.getProperty('ANTHROPIC_API_KEY');
  if (!key) return { ok: false, error: 'nokey' };
  if (!b.image || String(b.image).length < 100) return { ok: false, error: 'noimage' };
  if (String(b.image).length > 6000000) return { ok: false, error: 'toolarge' };
  const day = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const ck = 'cnt:' + day + ':' + folderName;
  const used = parseInt(props.getProperty(ck) || '0', 10);
  if (used >= MAX_EXTRACT_PER_DAY) return { ok: false, error: 'limit' };
  props.setProperty(ck, String(used + 1));
  const mime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].indexOf(b.mime) >= 0 ? b.mime : 'image/jpeg';
  const body = {
    model: MODEL, max_tokens: 4000,
    system: PROMPT_ + '\nToday is ' + day + '.',
    messages: [{ role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: mime, data: b.image } },
      { type: 'text', text: 'Extract this invoice as JSON.' }
    ] }]
  };
  const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' }, payload: JSON.stringify(body)
  });
  const code = res.getResponseCode(), txt = res.getContentText();
  if (code !== 200) return { ok: false, error: 'api ' + code + ': ' + txt.slice(0, 200) };
  let text = '';
  try { const j = JSON.parse(txt); text = (j.content || []).filter(function (c) { return c.type === 'text'; }).map(function (c) { return c.text; }).join(''); }
  catch (e) { return { ok: false, error: 'badresponse' }; }
  const data = parseJson_(text);
  if (!data) return { ok: false, error: 'unreadable' };
  return { ok: true, data: data };
}

function parseJson_(text) {
  const s = String(text || '');
  const a = s.indexOf('{'), z = s.lastIndexOf('}');
  if (a < 0 || z <= a) return null;
  try { return JSON.parse(s.slice(a, z + 1)); } catch (e) { return null; }
}
