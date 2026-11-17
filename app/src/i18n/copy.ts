export type Lang = 'tr' | 'en';

const tr = {
  tagline: 'Uzun bir videodan istediğin kesiti bulur, senin makinende keser.',
  pick: 'Dosya seç',
  dropHere: 'Videoyu buraya bırak',
  dropOrPick: 'ya da tıklayıp seç',
  sourceSection: 'Kaynak',
  searchSection: 'Arama',
  timeline: 'Tüm kayıt',
  timelineLabel: (count: number) => `Kaydın tamamı, üzerinde ${count} aday kesit işaretli`,
  startSteps: [
    {
      title: 'Videoyu seç',
      body: 'Altyazı dosyanın içinde olabilir, yanında da durabilir. İkisi de olur.',
    },
    {
      title: 'Kelimeleri yaz',
      body: 'Kesitler altyazı satırlarından bulunur. Ekler kendiliğinden eşleşir.',
    },
    {
      title: 'Kesitleri kırp',
      body: 'Başlangıcı ve bitişi elle düzelt, sonra kırp. Her kesit neden seçildiğini söyler.',
    },
  ],
  chooseTrack: 'Bu dosyanın içinde altyazı var',
  chooseTrackHint: 'Hangisiyle çalışayım? Resim tabanlı olanlar metne çevrilemez.',
  idleTitle: 'Aramak için soldaki kelimeleri yaz.',
  idleBody: 'Sonuçlar burada, kaydın tamamı üzerinde görünür.',
  noMatchHint: 'Başka bir kelime ya da daha kısa bir süre aralığı dene.',
  backToCandidates: 'Adaylara dön',
  removed: 'çıkarıldı',
  dismiss: 'Kapat',
  opening: 'Açılıyor…',
  another: 'Dosya değiştir',
  fromFile: 'Dosyadan seç',
  embedded: 'gömülü altyazı',
  offset: 'Kaydırma (sn)',
  offsetHint: 'Altyazı sesin önünde ya da arkasında kalıyorsa buradan kaydır.',
  offsetValue: (ms: number) => `${ms > 0 ? '+' : ''}${(ms / 1000).toFixed(1).replace('.', ',')}`,
  offsetStepShort: (ms: number) =>
    `${ms > 0 ? '+' : '-'}${Math.abs(ms) % 1000 === 0 ? Math.abs(ms) / 1000 : (Math.abs(ms) / 1000).toFixed(1).replace('.', ',')}`,
  offsetReset: 'Sıfırla',
  clampedCues: (count: number) => `${count} satır sıfıra kırpıldı`,
  listen: 'dinle',
  cues: 'Satır',
  systemMedia:
    'Medya araçları uygulamayla birlikte gelmedi, bu makinedeki FFmpeg kullanılıyor.',
  modelSection: 'Model',
  settingsOpen: 'Ayarlar',
  settingsLead: 'Görünüm ve model buradan seçilir.',
  appearanceSection: 'Görünüm',
  appearanceSystem: 'Sistem',
  appearanceLight: 'Açık',
  appearanceDark: 'Koyu',
  appearanceHint: 'Sistem, masaüstünün temasını izler.',
  engineSection: 'Motor',
  settingsUnreadable: (detail: string) =>
    `Ayarlar okunamadı, varsayılanlarla başlandı: ${detail}`,
  settingsFile: 'Dosya',
  modeHeuristic: 'Sezgisel',
  modeLocal: 'Yerel',
  modeCloud: 'Bulut',
  modeHint: 'Sezgisel mod model kullanmaz: kesitler kelime eşleşmesiyle bulunur.',
  modelAddress: 'Adres',
  findModels: 'Modelleri bul',
  modelsFound: (count: number) => `${count} model bulundu`,
  noModels: 'Sunucu model listesi vermedi.',
  modelProvider: 'Sağlayıcı',
  modelName: 'Model',
  modelKey: 'API anahtarı',
  saveKey: 'Kaydet',
  clearKey: 'Sil',
  keyStored: 'anahtar kayıtlı',
  keyMissing: 'anahtar yok',
  rank: 'Modelle sırala',
  ranking: 'Sıralanıyor…',
  confirmTitle: 'Bu metin gönderilecek',
  confirmAmount: 'Gönderilecek',
  confirmBody: 'Video değil, yalnızca altyazı satırları.',
  confirmCancel: 'Vazgeç',
  confirmSend: 'Gönder',
  confirmLines: (cues: number, chars: number) =>
    `${cues} satır · ${chars.toLocaleString('tr-TR')} karakter`,
  confirmLeftOut: (count: number) => `${count} aday bütçeye sığmadı`,
  confirmShortened: (count: number) => `${count} adayın satırları kısaltıldı`,
  rankedBy: (model: string) => `${model} sıraladı`,
  heuristicBadge: 'sezgisel',
  terms: 'Kelimeler',
  termsHint: 'Virgülle ayır.',
  termsExample: 'kaygı, endişe',
  min: 'En kısa (sn)',
  max: 'En uzun (sn)',
  search: 'Kesitleri bul',
  searching: 'Aranıyor…',
  noMatch: 'Bu kelimeler geçen bir satır bulunamadı.',
  found: (count: number) => `${count} aday kesit`,
  matchedTerms: (terms: string[]) => `${terms.map((t) => `«${t}»`).join(', ')} geçiyor`,
  matchedLines: (count: number) => `${count} satır`,
  pictureTrack: 'resim tabanlı, okunamaz',
  show: 'İzle',
  hide: 'Kapat',
  preparing: 'Hazırlanıyor…',
  firstSeconds: (seconds: number) => `adayın ilk ${seconds} saniyesi`,
  showLines: 'Satırlar',
  hideLines: 'Satırları gizle',
  startLabel: 'Başlangıç',
  endLabel: 'Bitiş',
  secondBack: '-1 sn',
  secondForward: '+1 sn',
  cueBack: '-1 satır',
  cueForward: '+1 satır',
  reset: 'Aralığı sıfırla',
  reject: 'Çıkar',
  cut: 'Seçilenleri kırp',
  cutting: 'Kırpılıyor…',
  cutDone: (ok: number) => `${ok} dosya oluşturuldu`,
  cutPartial: (ok: number, failed: number) => `${ok} dosya oluşturuldu, ${failed} tanesi başarısız`,
  cutNothing: 'Hiçbir dosya oluşmadı',
  written: 'Yazılan dosyalar',
  writtenTo: 'Klasör',
  failed: 'başarısız',
  clamped: 'Sınıra dayandı',
  errors: {
    ffmpegMissing: (name?: string) =>
      `Medya araçları bulunamadı (${name ?? 'ffmpeg'}). Uygulamayı yeniden kurmak gerekiyor.`,
    mediaUnreadable: (path?: string, reason?: string) => `${path} okunamadı: ${reason}`,
    mediaProbeFailed: (path?: string, tail?: string) => `${path} bir video olarak tanınmadı: ${tail}`,
    subtitleUnreadable: (path?: string, reason?: string) => `${path} altyazı olarak okunamadı: ${reason}`,
    subtitleEmpty: (path?: string) => `${path} içinde kullanılabilir altyazı satırı yok.`,
    noSession: () => 'Önce bir video ve altyazı seç.',
    emptyTerms: () => 'Aramak için en az bir kelime yaz.',
    providerUnreachable: (address?: string) => `${address ?? 'Sunucu'} cevap vermedi.`,
    providerAuth: (message?: string) => `Anahtar reddedildi: ${message ?? 'sebep bildirilmedi'}`,
    providerBusy: (ms?: string) => `Sağlayıcı meşguldü; ${ms ?? ''} ms beklendi.`,
    providerMalformed: (detail?: string) => `Modelin cevabı kullanılamadı: ${detail ?? 'biçim bozuk'}`,
    providerInvalidIndex: (candidate?: string, index?: string) =>
      `${candidate} numaralı adayda ${index} satırı yok.`,
    unconfirmed: () => 'Hiçbir şey gönderilmedi: yük onaydan sonra değişti.',
    missingKey: () => 'Önce bir API anahtarı kaydet.',
    keyringFailed: (detail?: string) => `Anahtar kasası kullanılamadı: ${detail ?? 'sebep bildirilmedi'}`,
    settingsWrite: (detail?: string) => `Ayar yazılamadı: ${detail ?? 'sebep bildirilmedi'}`,
    heuristicMode: () => 'Sezgisel mod model kullanmaz.',
    providerHttp: (status?: string, message?: string) => `Sağlayıcı ${status} döndü: ${message ?? ''}`,
    unknown: () => 'Beklenmeyen bir hata oluştu.',
  },
};

const en: typeof tr = {
  tagline: 'Finds the clip you asked for in a long video and cuts it on your machine.',
  pick: 'Choose a file',
  dropHere: 'Drop the video here',
  dropOrPick: 'or click to choose',
  sourceSection: 'Source',
  searchSection: 'Search',
  timeline: 'Whole recording',
  timelineLabel: (count: number) => `The whole recording, with ${count} candidate clips marked`,
  startSteps: [
    {
      title: 'Choose the video',
      body: 'The subtitles may sit inside the file or next to it. Both work.',
    },
    {
      title: 'Type the words',
      body: 'Clips are found in the subtitle lines, never by watching the video.',
    },
    {
      title: 'Cut the clips',
      body: 'Nudge the in and out points, then cut. Every clip says why it was picked.',
    },
  ],
  chooseTrack: 'This file already carries subtitles',
  chooseTrackHint: 'Which one should I use? Picture-based tracks cannot be read as text.',
  idleTitle: 'Type the words on the left to search.',
  idleBody: 'Results appear here, over the whole recording.',
  noMatchHint: 'Try another word, or a shorter duration range.',
  backToCandidates: 'Back to the candidates',
  removed: 'removed',
  dismiss: 'Dismiss',
  opening: 'Opening…',
  another: 'Change file',
  fromFile: 'Choose a file',
  embedded: 'embedded subtitle',
  offset: 'Shift (s)',
  offsetHint: 'Use this when the subtitles run ahead of the sound, or behind it.',
  offsetValue: (ms: number) => `${ms > 0 ? '+' : ''}${(ms / 1000).toFixed(1)}`,
  offsetStepShort: (ms: number) =>
    `${ms > 0 ? '+' : '-'}${Math.abs(ms) % 1000 === 0 ? Math.abs(ms) / 1000 : (Math.abs(ms) / 1000).toFixed(1)}`,
  offsetReset: 'Reset',
  clampedCues: (count: number) => `${count} lines clamped to zero`,
  listen: 'play',
  cues: 'Lines',
  systemMedia: 'The media tools were not bundled, so the FFmpeg on this machine is used.',
  modelSection: 'Model',
  settingsOpen: 'Settings',
  settingsLead: 'The appearance and the model are chosen here.',
  appearanceSection: 'Appearance',
  appearanceSystem: 'System',
  appearanceLight: 'Light',
  appearanceDark: 'Dark',
  appearanceHint: 'System follows the desktop theme.',
  engineSection: 'Engine',
  settingsUnreadable: (detail: string) =>
    `The settings could not be read, so the defaults are in force: ${detail}`,
  settingsFile: 'File',
  modeHeuristic: 'Heuristic',
  modeLocal: 'Local',
  modeCloud: 'Cloud',
  modeHint: 'Heuristic mode asks no model: clips are found by matching words.',
  modelAddress: 'Address',
  findModels: 'Find models',
  modelsFound: (count: number) => `${count} models found`,
  noModels: 'The server did not list any model.',
  modelProvider: 'Provider',
  modelName: 'Model',
  modelKey: 'API key',
  saveKey: 'Save',
  clearKey: 'Delete',
  keyStored: 'key stored',
  keyMissing: 'no key',
  rank: 'Rank with the model',
  ranking: 'Ranking…',
  confirmTitle: 'This text will be sent',
  confirmAmount: 'To send',
  confirmBody: 'Not the video: only the subtitle lines.',
  confirmCancel: 'Cancel',
  confirmSend: 'Send',
  confirmLines: (cues: number, chars: number) =>
    `${cues} lines · ${chars.toLocaleString('en-US')} characters`,
  confirmLeftOut: (count: number) => `${count} candidates did not fit the budget`,
  confirmShortened: (count: number) => `${count} candidates had their lines shortened`,
  rankedBy: (model: string) => `ranked by ${model}`,
  heuristicBadge: 'heuristic',
  terms: 'Words',
  termsHint: 'Separate with commas.',
  termsExample: 'grief, worry',
  min: 'Shortest (s)',
  max: 'Longest (s)',
  search: 'Find clips',
  searching: 'Searching…',
  noMatch: 'No line contained those words.',
  found: (count: number) => `${count} candidate clips`,
  matchedTerms: (terms: string[]) => `mentions ${terms.map((t) => `"${t}"`).join(', ')}`,
  matchedLines: (count: number) => `${count} lines`,
  pictureTrack: 'picture-based, not text',
  show: 'Watch',
  hide: 'Close',
  preparing: 'Preparing…',
  firstSeconds: (seconds: number) => `the first ${seconds} seconds of the clip`,
  showLines: 'Lines',
  hideLines: 'Hide lines',
  startLabel: 'Start',
  endLabel: 'End',
  secondBack: '-1 s',
  secondForward: '+1 s',
  cueBack: '-1 line',
  cueForward: '+1 line',
  reset: 'Reset range',
  reject: 'Remove',
  cut: 'Cut the selected clips',
  cutting: 'Cutting…',
  cutDone: (ok: number) => `${ok} files written`,
  cutPartial: (ok: number, failed: number) => `${ok} files written, ${failed} failed`,
  cutNothing: 'No file was written',
  written: 'Files written',
  writtenTo: 'Folder',
  failed: 'failed',
  clamped: 'Hit the limit',
  errors: {
    ffmpegMissing: (name?: string) =>
      `The media tools were not found (${name ?? 'ffmpeg'}). Reinstalling is needed.`,
    mediaUnreadable: (path?: string, reason?: string) => `${path} could not be read: ${reason}`,
    mediaProbeFailed: (path?: string, tail?: string) => `${path} was not recognised as media: ${tail}`,
    subtitleUnreadable: (path?: string, reason?: string) =>
      `${path} could not be read as subtitles: ${reason}`,
    subtitleEmpty: (path?: string) => `${path} holds no usable subtitle line.`,
    noSession: () => 'Choose a video and its subtitles first.',
    emptyTerms: () => 'Type at least one word to search for.',
    providerUnreachable: (address?: string) => `${address ?? 'The server'} did not answer.`,
    providerAuth: (message?: string) => `The key was refused: ${message ?? 'no reason given'}`,
    providerBusy: (ms?: string) => `The provider was busy; waited ${ms ?? ''} ms.`,
    providerMalformed: (detail?: string) => `The model's answer was not usable: ${detail ?? 'malformed'}`,
    providerInvalidIndex: (candidate?: string, index?: string) =>
      `Candidate ${candidate} has no line ${index}.`,
    unconfirmed: () => 'Nothing was sent: the payload changed after confirmation.',
    missingKey: () => 'Store an API key first.',
    keyringFailed: (detail?: string) => `The keychain could not help: ${detail ?? 'no reason given'}`,
    settingsWrite: (detail?: string) => `The settings could not be kept: ${detail ?? 'no reason given'}`,
    heuristicMode: () => 'Heuristic mode asks no model.',
    providerHttp: (status?: string, message?: string) => `The provider answered ${status}: ${message ?? ''}`,
    unknown: () => 'Something unexpected went wrong.',
  },
};

export const copy: Record<Lang, typeof tr> = { tr, en };

export function errorMessage(payload: unknown, lang: Lang): string {
  const error = payload as Partial<Record<string, string>> | null;
  const text = copy[lang].errors;
  const kind = error?.kind ?? '';
  switch (kind) {
    case 'ffmpegMissing':
      return text.ffmpegMissing(error?.name);
    case 'mediaUnreadable':
      return text.mediaUnreadable(error?.path, error?.reason);
    case 'mediaProbeFailed':
      return text.mediaProbeFailed(error?.path, error?.tail);
    case 'subtitleUnreadable':
      return text.subtitleUnreadable(error?.path, error?.reason);
    case 'subtitleEmpty':
      return text.subtitleEmpty(error?.path);
    case 'noSession':
      return text.noSession();
    case 'emptyTerms':
      return text.emptyTerms();
    case 'unreachable':
      return text.providerUnreachable(error?.address);
    case 'auth':
      return text.providerAuth(error?.message);
    case 'busy':
      return text.providerBusy(error?.retryAfterMs);
    case 'malformedAnswer':
      return text.providerMalformed(error?.detail);
    case 'invalidIndex':
      return text.providerInvalidIndex(error?.candidate, error?.index);
    case 'unconfirmed':
      return text.unconfirmed();
    case 'missingKey':
      return text.missingKey();
    case 'keyring':
      return text.keyringFailed(error?.detail);
    case 'settings':
      return text.settingsWrite(error?.detail);
    case 'heuristic':
      return text.heuristicMode();
    case 'http':
      return text.providerHttp(error?.status, error?.message);
    default:
      return text.unknown();
  }
}
