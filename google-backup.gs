/* Order Guard — Google Drive 백업 받는 스크립트
   1) 아래 TOKEN 을 길고 아무도 모르는 단어로 바꾸세요. (앱의 '비밀 단어'와 같아야 합니다)
   2) 배포 → 새 배포 → 웹 앱 → 실행 계정: 나 / 액세스: 모든 사용자
*/
const TOKEN = '여기를-길고-어려운-문장으로-바꾸세요';
const FOLDER = 'Order Guard Backup';

function folder_() { const it = DriveApp.getFoldersByName(FOLDER); return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER); }
function file_(f, name) { const it = f.getFilesByName(name); return it.hasNext() ? it.next() : null; }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

// 앱 → 구글: 데이터 저장
function doPost(e) {
  try {
    const b = JSON.parse(e.postData.contents);
    if (b.token !== TOKEN) return out_({ ok: false, error: 'auth' });
    const f = folder_(), json = JSON.stringify(b.data);
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
  if (!e.parameter || e.parameter.token !== TOKEN) return out_({ ok: false, error: 'auth' });
  const cur = file_(folder_(), 'current.json');
  return out_({ ok: true, data: cur ? JSON.parse(cur.getBlob().getDataAsString()) : null });
}
