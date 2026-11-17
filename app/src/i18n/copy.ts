export type Lang = 'tr' | 'en';

const tr = {
  tagline: 'Uzun bir videodan istediğin kesiti bulur, senin makinende keser.',
  pick: 'Video ve altyazı seç',
  opening: 'Açılıyor…',
  another: 'Başka bir dosya seç',
  video: 'Video',
  subtitle: 'Altyazı',
  subtitleSource: 'Altyazı kaynağı',
  fromFile: 'Dosyadan seç',
  embedded: 'gömülü',
  pictureTrack: 'resim tabanlı, metin olarak okunamaz',
  trackLine: (label: string, codec: string) => `${label} · ${codec}`,
  duration: 'Süre',
  cues: 'Satır',
  encoding: 'Kodlama',
  systemMedia:
    'Medya araçları uygulamayla birlikte gelmedi, bu makinedeki FFmpeg kullanılıyor.',
  terms: 'Aranacak kelimeler',
  termsHint: 'Virgülle ayır. Türkçe ekler kendiliğinden eşleşir.',
  min: 'En kısa (sn)',
  max: 'En uzun (sn)',
  search: 'Kesitleri bul',
  searching: 'Aranıyor…',
  noMatch: 'Bu kelimeler geçen bir satır bulunamadı.',
  found: (count: number) => `${count} aday kesit`,
  matchedTerms: (terms: string[]) => `${terms.map((t) => `«${t}»`).join(', ')} geçiyor`,
  showLines: 'Satırları göster',
  hideLines: 'Satırları gizle',
  startLabel: 'Başlangıç',
  endLabel: 'Bitiş',
  secondBack: '-1 sn',
  secondForward: '+1 sn',
  cueBack: '-1 satır',
  cueForward: '+1 satır',
  reset: 'Sıfırla',
  reject: 'Çıkar',
  cut: 'Seçilenleri kırp',
  cutting: 'Kırpılıyor…',
  cutDone: (ok: number) => `${ok} dosya oluşturuldu`,
  cutPartial: (ok: number, failed: number) => `${ok} dosya oluşturuldu, ${failed} tanesi başarısız`,
  cutNothing: 'Hiçbir dosya oluşmadı',
  written: 'Yazılan dosyalar',
  failed: 'başarısız',
  clamped: 'Süre sınırına dayandı',
  errors: {
    ffmpegMissing: (name?: string) =>
      `Medya araçları bulunamadı (${name ?? 'ffmpeg'}). Uygulamayı yeniden kurmak gerekiyor.`,
    mediaUnreadable: (path?: string, reason?: string) => `${path} okunamadı: ${reason}`,
    mediaProbeFailed: (path?: string, tail?: string) => `${path} bir video olarak tanınmadı: ${tail}`,
    subtitleUnreadable: (path?: string, reason?: string) => `${path} altyazı olarak okunamadı: ${reason}`,
    subtitleEmpty: (path?: string) => `${path} içinde kullanılabilir altyazı satırı yok.`,
    noSession: () => 'Önce bir video ve altyazı seç.',
    emptyTerms: () => 'Aramak için en az bir kelime yaz.',
    unknown: () => 'Beklenmeyen bir hata oluştu.',
  },
};

const en: typeof tr = {
  tagline: 'Finds the clip you asked for in a long video and cuts it on your machine.',
  pick: 'Choose a video and subtitles',
  opening: 'Opening…',
  another: 'Choose another file',
  video: 'Video',
  subtitle: 'Subtitles',
  subtitleSource: 'Subtitle source',
  fromFile: 'Choose a file',
  embedded: 'embedded',
  pictureTrack: 'stores pictures, cannot be read as text',
  trackLine: (label: string, codec: string) => `${label} · ${codec}`,
  duration: 'Duration',
  cues: 'Lines',
  encoding: 'Encoding',
  systemMedia: 'The media tools were not bundled, so the FFmpeg on this machine is used.',
  terms: 'Words to look for',
  termsHint: 'Separate with commas. Turkish suffixes match on their own.',
  min: 'Shortest (s)',
  max: 'Longest (s)',
  search: 'Find clips',
  searching: 'Searching…',
  noMatch: 'No line contained those words.',
  found: (count: number) => `${count} candidate clips`,
  matchedTerms: (terms: string[]) => `mentions ${terms.map((t) => `"${t}"`).join(', ')}`,
  showLines: 'Show lines',
  hideLines: 'Hide lines',
  startLabel: 'Start',
  endLabel: 'End',
  secondBack: '-1 s',
  secondForward: '+1 s',
  cueBack: '-1 line',
  cueForward: '+1 line',
  reset: 'Reset',
  reject: 'Remove',
  cut: 'Cut the selected clips',
  cutting: 'Cutting…',
  cutDone: (ok: number) => `${ok} files written`,
  cutPartial: (ok: number, failed: number) => `${ok} files written, ${failed} failed`,
  cutNothing: 'No file was written',
  written: 'Files written',
  failed: 'failed',
  clamped: 'Hit the duration limit',
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
    default:
      return text.unknown();
  }
}
