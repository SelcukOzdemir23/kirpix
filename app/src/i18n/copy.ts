export type Lang = 'tr' | 'en';

const tr = {
  tagline: 'Uzun bir videodan istediğin kesiti bulur, senin makinende keser.',
  pick: 'Dosya seç',
  dropHere: 'Videoyu buraya bırak',
  chooseTrack: 'Bu dosyanın içinde altyazı var',
  chooseTrackHint: 'Hangisiyle çalışayım? Resim tabanlı olanlar metne çevrilemez.',
  noMatchHint: 'Başka bir kelime ya da daha kısa bir süre aralığı dene.',
  backToCandidates: 'Adaylara dön',
  dismiss: 'Kapat',
  opening: 'Açılıyor…',
  another: 'Dosya değiştir',
  fromFile: 'Dosyadan seç',
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
  settingsClose: 'Ayarlar\'ı kapat',
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
  ranking: 'Sıralanıyor…',
  confirmTitle: 'Bu metin gönderilecek',
  confirmAmount: 'Gönderilecek',
  confirmBody: 'Video değil, yalnızca altyazı satırları.',
  confirmCancel: 'Vazgeç',
  confirmSend: 'Gönder',
  confirmLines: (cues: number, chars: number) =>
    `${cues} satır, ${chars.toLocaleString('tr-TR')} karakter`,
  confirmLeftOut: (count: number) => `${count} aday bütçeye sığmadı`,
  confirmShortened: (count: number) => `${count} adayın satırları kısaltıldı`,
  rankedBy: (model: string) => `${model} sıraladı`,
  heuristicBadge: 'sezgisel',
  terms: 'Kelimeler',
  termsExample: 'kaygı, endişe',
  min: 'En kısa (sn)',
  max: 'En uzun (sn)',
  search: 'Kesitleri bul',
  searching: 'Aranıyor…',
  noMatch: 'Bu kelimeler geçen bir satır bulunamadı.',
  matchedTerms: (terms: string[]) => `${terms.map((t) => `«${t}»`).join(', ')} geçiyor`,
  pictureTrack: 'resim tabanlı, okunamaz',
  preparing: 'Hazırlanıyor…',
  firstSeconds: (seconds: number) => `adayın ilk ${seconds} saniyesi`,
  startLabel: 'Başlangıç',
  endLabel: 'Bitiş',
  reset: 'Aralığı sıfırla',
  cut: 'Seçilenleri kırp',
  cutting: 'Kırpılıyor…',
  cutDone: (ok: number) => `${ok} dosya oluşturuldu`,
  cutPartial: (ok: number, failed: number) => `${ok} dosya oluşturuldu, ${failed} tanesi başarısız`,
  cutNothing: 'Hiçbir dosya oluşmadı',
  written: 'Yazılan dosyalar',
  writtenTo: 'Klasör',
  failed: 'başarısız',
  clamped: 'Sınıra dayandı',
  // Feature 007: the criterion cards, the results screen and its parts.
  question: 'Ne arıyorsun?',
  criteria: {
    topic: { name: 'Konu', line: 'Bu kelimelerin geçtiği yerler' },
    duration: { name: 'Süre', line: 'Toplam 5 dakika, en yoğun yerlerden' },
    arc: { name: 'Akış', line: 'Başı ve sonu belli tek bölüm' },
    hook: { name: 'Dikkat çeken açılış', line: 'İzleyeni ilk saniyede tutan yerler' },
    own: { name: 'Kendi cümlen', line: 'Ne aradığını bir cümleyle yaz' },
  },
  notYet: 'Henüz yok',
  notYetTitle: (roadmap: string) => `Bu kriter yol haritasında ${roadmap} numaralı dilimle gelecek.`,
  termsLabel: 'Kelimeler, virgülle',
  shortest: 'En kısa',
  longest: 'En uzun',
  seconds: 'sn',
  boundsText: (min: number, max: number) => `${min} ile ${max} saniye arası`,
  searchAgain: 'Yeniden ara',
  clipsFound: (count: number) => `${count} kesit bulundu`,
  reasonLine: (terms: string[], lines: number) =>
    `${terms.join(' ve ')} geçiyor, ${lines} satırda`,
  alignment: 'Altyazı hizası',
  alignmentOffset: (value: string) => `Kaydırma ${value} sn`,
  alignmentSource: (cues: number, source: string) => `${cues} satır, ${source}`,
  alignmentClears: 'Kaydırınca bulunan kesitler silinir; sonra yeniden ara.',
  sourceEmbedded: 'videonun içinden',
  sourceFile: 'ayrı dosyadan',
  close: 'Kapat',
  preview: 'Önizle',
  closePreview: 'Önizlemeyi kapat',
  stepLabel: 'Adım',
  stepSecond: '1 sn',
  stepLine: '1 satır',
  earlier: 'Erken al',
  later: 'Geç al',
  resetEdges: 'Sıfırla',
  keep: 'Kesilecekler arasında',
  cutCount: (count: number) => (count === 0 ? 'Kesilecek kesit yok' : `${count} kesiti kes`),
  folder: 'Klasör',
  folderAsk: 'kesince sorulacak',
  changeFolder: 'Değiştir',
  rulerLabel: 'Kaydın tamamı; bir işarete basınca o kesit seçilir',
  markLabel: (start: string, end: string) => `${start} ile ${end} arasındaki kesiti seç`,
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
  chooseTrack: 'This file already carries subtitles',
  chooseTrackHint: 'Which one should I use? Picture-based tracks cannot be read as text.',
  noMatchHint: 'Try another word, or a shorter duration range.',
  backToCandidates: 'Back to the candidates',
  dismiss: 'Dismiss',
  opening: 'Opening…',
  another: 'Change file',
  fromFile: 'Choose a file',
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
  settingsClose: 'Close settings',
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
  ranking: 'Ranking…',
  confirmTitle: 'This text will be sent',
  confirmAmount: 'To send',
  confirmBody: 'Not the video: only the subtitle lines.',
  confirmCancel: 'Cancel',
  confirmSend: 'Send',
  confirmLines: (cues: number, chars: number) =>
    `${cues} lines, ${chars.toLocaleString('en-US')} characters`,
  confirmLeftOut: (count: number) => `${count} candidates did not fit the budget`,
  confirmShortened: (count: number) => `${count} candidates had their lines shortened`,
  rankedBy: (model: string) => `ranked by ${model}`,
  heuristicBadge: 'heuristic',
  terms: 'Words',
  termsExample: 'grief, worry',
  min: 'Shortest (s)',
  max: 'Longest (s)',
  search: 'Find clips',
  searching: 'Searching…',
  noMatch: 'No line contained those words.',
  matchedTerms: (terms: string[]) => `mentions ${terms.map((t) => `"${t}"`).join(', ')}`,
  pictureTrack: 'picture-based, not text',
  preparing: 'Preparing…',
  firstSeconds: (seconds: number) => `the first ${seconds} seconds of the clip`,
  startLabel: 'Start',
  endLabel: 'End',
  reset: 'Reset range',
  cut: 'Cut the selected clips',
  cutting: 'Cutting…',
  cutDone: (ok: number) => `${ok} files written`,
  cutPartial: (ok: number, failed: number) => `${ok} files written, ${failed} failed`,
  cutNothing: 'No file was written',
  written: 'Files written',
  writtenTo: 'Folder',
  failed: 'failed',
  clamped: 'Hit the limit',
  // Feature 007: the criterion cards, the results screen and its parts.
  question: 'What are you looking for?',
  criteria: {
    topic: { name: 'Topic', line: 'Where these words come up' },
    duration: { name: 'Duration', line: 'Five minutes in total, from the densest parts' },
    arc: { name: 'Arc', line: 'One passage with a beginning and an end' },
    hook: { name: 'Hook', line: 'Openings that hold a viewer from the first second' },
    own: { name: 'Your sentence', line: 'Say what you are looking for in a sentence' },
  },
  notYet: 'Not yet',
  notYetTitle: (roadmap: string) => `This criterion arrives with roadmap slice ${roadmap}.`,
  termsLabel: 'Words, separated by commas',
  shortest: 'Shortest',
  longest: 'Longest',
  seconds: 's',
  boundsText: (min: number, max: number) => `between ${min} and ${max} seconds`,
  searchAgain: 'Search again',
  clipsFound: (count: number) => `${count} ${count === 1 ? 'clip' : 'clips'} found`,
  reasonLine: (terms: string[], lines: number) =>
    `${terms.join(' and ')} ${terms.length === 1 ? 'comes' : 'come'} up, in ${lines} ${lines === 1 ? 'line' : 'lines'}`,
  alignment: 'Subtitle timing',
  alignmentOffset: (value: string) => `Shift ${value} s`,
  alignmentSource: (cues: number, source: string) => `${cues} lines, ${source}`,
  alignmentClears: 'Shifting clears the clips found; search again afterwards.',
  sourceEmbedded: 'from inside the video',
  sourceFile: 'from a separate file',
  close: 'Close',
  preview: 'Preview',
  closePreview: 'Close preview',
  stepLabel: 'Step',
  stepSecond: '1 s',
  stepLine: '1 line',
  earlier: 'Earlier',
  later: 'Later',
  resetEdges: 'Reset',
  keep: 'Among the clips to cut',
  cutCount: (count: number) =>
    count === 0 ? 'No clip to cut' : `Cut ${count} ${count === 1 ? 'clip' : 'clips'}`,
  folder: 'Folder',
  folderAsk: 'asked when you cut',
  changeFolder: 'Change',
  rulerLabel: 'The whole recording; press a mark to select that clip',
  markLabel: (start: string, end: string) => `Select the clip from ${start} to ${end}`,
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
