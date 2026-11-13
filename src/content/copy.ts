export type Lang = 'tr' | 'en';

const tr = {
  meta: {
    title: 'Kirpix - aradığın kesit altyazıda',
    description:
      'Altyazılı bir videodan kriterine uyan kesitleri bulan, tamamen kendi bilgisayarında çalışan masaüstü uygulaması.',
  },
  nav: {
    how: 'Nasıl çalışır',
    modes: 'Kriterler',
    privacy: 'Gizlilik',
    status: 'Durum',
    github: 'GitHub',
    switchLabel: 'EN',
    switchHref: '/en/',
    switchLang: 'en',
    wordmarkHref: '/',
  },
  hero: {
    title: 'Aradığın kesit zaten altyazıda.',
    body: 'Bir video ve altyazısını ver, ne aradığını söyle. Kirpix kesitleri bulur, senin bilgisayarında keser.',
    primary: "GitHub'da incele",
    secondary: 'Nasıl çalışır',
    panel: {
      label: 'örnek kesit',
      range: '00:12:41 → 00:13:08',
      cues: [
        {
          time: '00:12:41',
          text: 'Piyasadaki araçların çoğu videonu bir sunucuya yüklüyor.',
        },
        {
          time: '00:12:49',
          text: 'Ben aynı işi kendi bilgisayarımda yapmak istedim.',
        },
        {
          time: '00:12:55',
          text: 'O yüzden videonun görüntüsüne değil, ne anlattığına baktım.',
        },
      ],
      reasonLabel: 'gerekçe',
      reason: 'Konu burada daralıyor: genel eleştiriden kendi kararına geçiyor.',
      timelineNote: '48 dakikalık kayıt, 3 kesit seçili',
    },
  },
  how: {
    title: 'Dört adımda kesit',
    body: 'Uzun bir videoyu baştan sona izlemiyorsun. Uygulama tarar, sen seçersin.',
    steps: [
      {
        name: 'Ekle',
        text: 'Videoyu sürükle. Altyazı videonun içindeyse çıkarılır, yanındaysa okunur, yoksa sorulur.',
      },
      {
        name: 'Hizala',
        text: 'Altyazı kaymışsa bir kez kaydırırsın. Kesit sınırları doğru yere oturur.',
      },
      {
        name: 'Seç',
        text: 'Kriterini söyle. Gelen aday kesitleri gerekçesiyle görür, istemediğini çıkarırsın.',
      },
      {
        name: 'Kırp',
        text: 'Onayladığın kesitler senin makinende kesilir ve seçtiğin klasöre yazılır.',
      },
    ],
  },
  why: {
    title: 'Anlam görüntüde değil, kelimede.',
    body: 'Konuşmanın neresinde ne söylendiği altyazıda yazıyor. Görüntüyü analiz etmek yavaş, pahalı ve gerekçelendirmesi zor. Altyazı okumak saniyeler sürer ve her seçimin nedenini gösterebilir.',
    points: [
      {
        name: 'Hızlı',
        text: 'Bir saatlik kaydın metni saniyeler içinde taranır.',
      },
      {
        name: 'Gerekçeli',
        text: 'Her kesit hangi cümleye dayandığını söyler. Kara kutu değil.',
      },
      {
        name: 'Ekonomik',
        text: 'Model yalnızca öne çıkan adayları görür, tüm transkripti değil.',
      },
    ],
  },
  modes: {
    title: 'Ne aradığını sen söylersin.',
    body: 'Dört hazır kriter, artı kendi cümlenle tarif etme. Hepsi aynı motorun üstünde çalışır.',
    items: [
      {
        tag: 'Süre',
        text: 'Toplam şu kadar dakika, en yoğun yerlerden.',
        example: 'hedef: 5 dk, kesit başına en az 20 sn',
      },
      {
        tag: 'Konu',
        text: 'Şu kelimelerin veya konuların geçtiği yerler.',
        example: 'ilk müşteri, fiyatlandırma',
      },
      {
        tag: 'Akış',
        text: 'Başı sonu belli, kendi içinde tamamlanan tek bölüm.',
        example: 'başlangıç, gelişme, sonuç',
      },
      {
        tag: 'Hook',
        text: 'Metnin ilginçliği ile ses enerjisini birlikte ölçer.',
        example: 'duraklama, yükselen ton, iddialı açılış',
      },
      {
        tag: 'Kendi kriterin',
        text: 'Kendi cümlenle yaz. Çıktı yine satır aralığı ve gerekçe olarak döner.',
        example: 'en tartışmalı iddia nerede?',
      },
    ],
  },
  privacy: {
    title: 'Video hiçbir yere gitmez.',
    body: 'Okuma, analiz, kırpma, yazma: hepsi senin makinende. İnternet kapalıyken de çalışır.',
    panels: [
      {
        tag: 'Yerel model',
        title: 'Ollama veya LM Studio',
        text: 'Bilgisayarındaki modeli bağla. Altyazı metni de cihazdan çıkmaz.',
        note: 'Hiçbir veri hiçbir yere gitmez.',
      },
      {
        tag: 'Bulut API',
        title: 'DeepSeek, OpenAI, Claude',
        text: 'Daha güçlü bir model istersen. Yalnızca altyazı metni gönderilir; video değil.',
        note: 'Seçerken bunu açıkça söyler, onay ister.',
      },
    ],
    fallback:
      'Hiçbirini kurmak istemezsen sezgisel mod var: ses enerjisi ve cümle sınırlarıyla çalışır, yapay zeka gerektirmez.',
  },
  status: {
    title: 'Şu an nerede?',
    body: 'Depo hazır, uygulama geliştiriliyor. Aşağıdaki liste abartılmadı: her madde ya bitti ya sırada.',
    readyLabel: 'Hazır',
    ready: ['Kapsam ve mimari kararları', 'İsim, logo, bu tanıtım sayfası'],
    nextLabel: 'Sırada',
    next: [
      'Altyazı okuma, çıkarma ve hizalama',
      'Dört kriter motoru ve aday seçimi',
      'FFmpeg ile kırpma, önizleme ve çıktı',
      'Whisper ile altyazı üretimi',
    ],
  },
  footer: {
    tagline: 'Uzun videodan doğru kesiti bulur, senin makinende keser.',
    github: 'Kaynak kodu',
    privacy: 'Telemetri yok, çerez yok, hesap yok.',
    license: 'MIT lisansı',
  },
};

const en: typeof tr = {
  meta: {
    title: 'Kirpix - the clip is in the subtitles',
    description:
      'A desktop app that finds the moments you are looking for in a subtitled video and cuts them on your own machine.',
  },
  nav: {
    how: 'How it works',
    modes: 'Criteria',
    privacy: 'Privacy',
    status: 'Status',
    github: 'GitHub',
    switchLabel: 'TR',
    switchHref: '/',
    switchLang: 'tr',
    wordmarkHref: '/en/',
  },
  hero: {
    title: 'The clip is in the subtitles.',
    body: 'A video plus its subtitles, a criterion from you, and Kirpix cuts the clips on your machine.',
    primary: 'View on GitHub',
    secondary: 'How it works',
    panel: {
      label: 'sample clip',
      range: '00:12:41 → 00:13:08',
      cues: [
        {
          time: '00:12:41',
          text: 'Most of the tools out there upload your video to a server.',
        },
        {
          time: '00:12:49',
          text: 'I wanted to do the same job on my own machine.',
        },
        {
          time: '00:12:55',
          text: 'So I looked at what the video says, not at its picture.',
        },
      ],
      reasonLabel: 'reason',
      reason: 'The topic narrows here: it moves from a general critique to a personal decision.',
      timelineNote: '48 minute recording, 3 clips selected',
    },
  },
  how: {
    title: 'Four steps to a clip',
    body: 'You do not watch the whole recording. The app scans it, you pick.',
    steps: [
      {
        name: 'Drop it in',
        text: 'Drag the video in. If subtitles are embedded they are extracted, if they sit next to it they are read, if there are none you are asked.',
      },
      {
        name: 'Line it up',
        text: 'If the subtitles are off, you nudge them once. Clip boundaries then land where they should.',
      },
      {
        name: 'Choose',
        text: 'State your criterion. Candidate clips arrive with a reason; drop the ones you do not want.',
      },
      {
        name: 'Cut',
        text: 'The clips you approve are cut on your machine and written to the folder you picked.',
      },
    ],
  },
  why: {
    title: 'Meaning is in the words, not the picture.',
    body: 'What gets said, and where, is already written in the subtitles. Reading a picture is slow, expensive and hard to justify. Reading text takes seconds and can show you why every clip was chosen.',
    points: [
      {
        name: 'Fast',
        text: 'The text of a one hour recording is scanned in seconds.',
      },
      {
        name: 'Explainable',
        text: 'Every clip says which line it rests on. Not a black box.',
      },
      {
        name: 'Economical',
        text: 'The model only sees the shortlisted candidates, not the whole transcript.',
      },
    ],
  },
  modes: {
    title: 'You say what you are looking for.',
    body: 'Four ready criteria, plus your own sentence. All of them run on the same engine.',
    items: [
      {
        tag: 'Duration',
        text: 'This many minutes in total, taken from the densest parts.',
        example: 'target: 5 min, at least 20 s per clip',
      },
      {
        tag: 'Topic',
        text: 'The places where these words or subjects come up.',
        example: 'first customer, pricing',
      },
      {
        tag: 'Arc',
        text: 'One part with a start and an end that holds together on its own.',
        example: 'setup, development, conclusion',
      },
      {
        tag: 'Hook',
        text: 'Scores how interesting the line is together with the audio energy.',
        example: 'a pause, a rising voice, a bold opening',
      },
      {
        tag: 'Your own',
        text: 'Write it in your own words. The answer still comes back as line ranges and a reason.',
        example: 'where is the most contested claim?',
      },
    ],
  },
  privacy: {
    title: 'Your video goes nowhere.',
    body: 'Reading, analysis, cutting, writing: all on your machine. It works with the network off.',
    panels: [
      {
        tag: 'Local model',
        title: 'Ollama or LM Studio',
        text: 'Connect the model on your machine. The subtitle text never leaves it either.',
        note: 'No data leaves the device at all.',
      },
      {
        tag: 'Cloud API',
        title: 'DeepSeek, OpenAI, Claude',
        text: 'If you want a stronger model. Only the subtitle text is sent, never the video.',
        note: 'The app says so plainly and asks before using it.',
      },
    ],
    fallback:
      'If you would rather install nothing, there is a heuristic mode: it works from audio energy and sentence boundaries, no model required.',
  },
  status: {
    title: 'Where it stands',
    body: 'The repository is ready, the app is being built. The list below is not padded: every item is either done or next.',
    readyLabel: 'Done',
    ready: ['Scope and architecture decisions', 'Name, logo, this page'],
    nextLabel: 'Next',
    next: [
      'Reading, extracting and aligning subtitles',
      'The four criteria and candidate selection',
      'Cutting with FFmpeg, preview and export',
      'Generating subtitles with Whisper',
    ],
  },
  footer: {
    tagline: 'Finds the right moment in a long video and cuts it on your machine.',
    github: 'Source code',
    privacy: 'No telemetry, no cookies, no account.',
    license: 'MIT license',
  },
};

export const copy: Record<Lang, typeof tr> = { tr, en };
