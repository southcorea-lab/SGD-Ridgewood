/* Order Guard — Google Drive 백업 받는 스크립트 (v2: 초대 코드별 폴더)
   1) 아래 CLIENTS 의 '코드'를 길고 아무도 모르는 문장으로 바꾸세요.
      형식:  '초대코드': '드라이브 폴더 이름'
   2) 배포 → 배포 관리 → 연필 → 버전: 새 버전 → 배포   (실행 계정: 나 / 액세스: 모든 사용자)
   * 이 파일에는 실제 코드를 적지 말고, 구글 스크립트 편집기 안에서만 적으세요. GitHub에 올리지 마세요.
*/
const CLIENTS = {
  'CHANGE-ME-owner-code': 'Order Guard Backup',
  'CHANGE-ME-test-code': 'Order Guard Backup (test)'
};

function folder_(name) { const it = DriveApp.getFoldersByName(name); return it.hasNext() ? it.next() : DriveApp.createFolder(name); }
function file_(f, name) { const it = f.getFilesByName(name); return it.hasNext() ? it.next() : null; }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function nameFor_(tok) { return (tok && Object.prototype.hasOwnProperty.call(CLIENTS, tok) && tok.indexOf('CHANGE-ME') !== 0) ? CLIENTS[tok] : null; }

// 앱 → 구글: 데이터 저장
function doPost(e) {
  try {
    const b = JSON.parse(e.postData.contents);
    const name = nameFor_(b.token);
    if (!name) return out_({ ok: false, error: 'auth' });
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
