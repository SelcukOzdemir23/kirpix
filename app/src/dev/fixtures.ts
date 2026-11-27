/*
  Fixed data for the fixture page (feature 007, research R6): the real result
  of the topic search for "kaygı, endişe" on the Turkish evaluation recording,
  `eval/fixtures/tr-tedx-kaygi.tr.vtt`, with the default bounds of 8 to 120
  seconds. Produced by the search and the marker themselves, not typed by hand;
  regenerate it if either changes.
*/
import type { Candidate, Cue, CutResult, SessionInfo, SubtitleTrack } from '../api';

export const session: SessionInfo = {
  videoPath: '/home/kullanici/Videolar/tr-tedx-kaygi.mkv',
  subtitleLabel: 'Türkçe',
  subtitleSource: 'embedded',
  durationMs: 877650,
  cueCount: 239,
  encoding: 'utf-8',
  width: 1280,
  height: 720,
  hasAudio: true,
  mediaSource: 'bundled',
  offsetMs: 0,
};

export const terms = ['kaygı', 'endişe'];

export const candidates: Candidate[] = [
  {
    "clamped": false,
    "durationMs": 41880,
    "endCue": 70,
    "endMs": 255536,
    "id": 1,
    "matchedCueCount": 5,
    "matchedDurationMs": 22000,
    "matchedTerms": [
      "kaygı",
      "endişe"
    ],
    "startCue": 59,
    "startMs": 213656
  },
  {
    "clamped": false,
    "durationMs": 25200,
    "endCue": 232,
    "endMs": 846056,
    "id": 2,
    "matchedCueCount": 2,
    "matchedDurationMs": 9560,
    "matchedTerms": [
      "kaygı",
      "endişe"
    ],
    "startCue": 227,
    "startMs": 820856
  },
  {
    "clamped": false,
    "durationMs": 9600,
    "endCue": 97,
    "endMs": 342976,
    "id": 3,
    "matchedCueCount": 2,
    "matchedDurationMs": 8600,
    "matchedTerms": [
      "kaygı",
      "endişe"
    ],
    "startCue": 96,
    "startMs": 333376
  },
  {
    "clamped": false,
    "durationMs": 8000,
    "endCue": 203,
    "endMs": 733616,
    "id": 4,
    "matchedCueCount": 1,
    "matchedDurationMs": 1960,
    "matchedTerms": [
      "kaygı",
      "endişe"
    ],
    "startCue": 203,
    "startMs": 725616
  }
];

/** The cues of every candidate plus one on each side, with their marks. */
export const cues: Cue[] = [
  {
    "endMs": 214156,
    "index": 58,
    "marks": [],
    "startMs": 211916,
    "text": "Bu kişi diyelim yürüyüşüne devam ediyor."
  },
  {
    "endMs": 219476,
    "index": 59,
    "marks": [
      [
        62,
        68
      ]
    ],
    "startMs": 214156,
    "text": "Yaklaşık 2-3 dakika sonra o korku duygusu kendisini büyük bir endişe"
  },
  {
    "endMs": 224756,
    "index": 60,
    "marks": [
      [
        23,
        29
      ],
      [
        33,
        38
      ]
    ],
    "startMs": 219476,
    "text": "duygusuna bırakıyor. O endişe ve kaygı ile birlikte kişi evine dönüyor hemen."
  },
  {
    "endMs": 227196,
    "index": 61,
    "marks": [],
    "startMs": 224756,
    "text": "Aslında işi gücü varken evine dönüyor."
  },
  {
    "endMs": 231036,
    "index": 62,
    "marks": [],
    "startMs": 227196,
    "text": "O gün eve kapanıyor. Şimdi bu bizim için bu ikincil"
  },
  {
    "endMs": 234196,
    "index": 63,
    "marks": [
      [
        13,
        19
      ]
    ],
    "startMs": 231036,
    "text": "ortaya çıkan endişe duygusu biraz anlaşılmaz bir şey."
  },
  {
    "endMs": 236196,
    "index": 64,
    "marks": [],
    "startMs": 234316,
    "text": "‘Nereden çıktı bu?’ diye düşünebiliriz."
  },
  {
    "endMs": 238116,
    "index": 65,
    "marks": [],
    "startMs": 236316,
    "text": "Çünkü burada bir parça eksik."
  },
  {
    "endMs": 242196,
    "index": 66,
    "marks": [
      [
        29,
        35
      ],
      [
        39,
        46
      ]
    ],
    "startMs": 238316,
    "text": "O anda o kişinin yürürken, o endişe ve kaygıyı hissederken,"
  },
  {
    "endMs": 245596,
    "index": 67,
    "marks": [],
    "startMs": 242196,
    "text": "zihninin içine girdiğimizde şu düşünceleri görüyoruz:"
  },
  {
    "endMs": 248236,
    "index": 68,
    "marks": [],
    "startMs": 245716,
    "text": "’Çok dikkatsizim. Her yer tehlike dolu."
  },
  {
    "endMs": 250636,
    "index": 69,
    "marks": [],
    "startMs": 248236,
    "text": "Her an başıma bir şey gelebilir, ölebilirim.′"
  },
  {
    "endMs": 255036,
    "index": 70,
    "marks": [
      [
        57,
        63
      ],
      [
        67,
        72
      ]
    ],
    "startMs": 250676,
    "text": "Tabii bu düşünceyi denklemin içine koyduğumuzda, hemen o endişe ve kaygı"
  },
  {
    "endMs": 256596,
    "index": 71,
    "marks": [],
    "startMs": 255036,
    "text": "duygusu anlaşılır hale geliyor."
  },
  {
    "endMs": 333636,
    "index": 95,
    "marks": [],
    "startMs": 329036,
    "text": "daha sonra eğer dışarıya çıkarsa yanında birisinin olmasını istemek."
  },
  {
    "endMs": 339156,
    "index": 96,
    "marks": [
      [
        67,
        75
      ]
    ],
    "startMs": 333876,
    "text": "İşte mümkün olduğunca yolda karşıdan karşıya geçmemek ve her an bu kaygıyla,"
  },
  {
    "endMs": 342476,
    "index": 97,
    "marks": [
      [
        0,
        9
      ]
    ],
    "startMs": 339156,
    "text": "endişeyle yaşamak çok uygun bir tepki gibi görünmüyor."
  },
  {
    "endMs": 348356,
    "index": 98,
    "marks": [],
    "startMs": 342476,
    "text": "Yani kişinin o istek ve ideallerine, kendisinin başına iyi şeyler gelmesini,"
  },
  {
    "endMs": 726076,
    "index": 202,
    "marks": [],
    "startMs": 723116,
    "text": "bitirecek. ’İleride iş bulabilir miyim?"
  },
  {
    "endMs": 728076,
    "index": 203,
    "marks": [
      [
        19,
        25
      ],
      [
        27,
        32
      ]
    ],
    "startMs": 726116,
    "text": "Ya iş bulamazsam?′ Endişe, kaygı."
  },
  {
    "endMs": 734396,
    "index": 204,
    "marks": [],
    "startMs": 728236,
    "text": "Peki ben ne istiyorum, ’kendi kariye- rime uygun bir işte çalışmak istiyorum.′"
  },
  {
    "endMs": 821356,
    "index": 226,
    "marks": [],
    "startMs": 815116,
    "text": "için devam eder. Örneğin, o kaçınan kişi, dışarı çıkmayan kişi kaçındıkça,"
  },
  {
    "endMs": 825276,
    "index": 227,
    "marks": [
      [
        16,
        22
      ],
      [
        26,
        31
      ]
    ],
    "startMs": 821356,
    "text": "evde kaldıkça o endişe ve kaygı duygusu devam eder."
  },
  {
    "endMs": 827716,
    "index": 228,
    "marks": [],
    "startMs": 825276,
    "text": "Ama istek ve ideali neydi?"
  },
  {
    "endMs": 833476,
    "index": 229,
    "marks": [],
    "startMs": 827716,
    "text": "Rahat olmak, özgür olmak, etrafın daha çok farkında olmak, yaşamak."
  },
  {
    "endMs": 835556,
    "index": 230,
    "marks": [],
    "startMs": 833596,
    "text": "Bunun için yapması gereken şey ne?"
  },
  {
    "endMs": 839916,
    "index": 231,
    "marks": [],
    "startMs": 835596,
    "text": "Dışarı çıkmak. Dışarı çıktıkça, yaşantıya karıştıkça,"
  },
  {
    "endMs": 845556,
    "index": 232,
    "marks": [
      [
        23,
        29
      ],
      [
        33,
        38
      ]
    ],
    "startMs": 839916,
    "text": "kaçınmadıkça giderek o endişe ve kaygı duygusu da giderek azalır."
  },
  {
    "endMs": 849316,
    "index": 233,
    "marks": [],
    "startMs": 845596,
    "text": "Özetlersem: Bir olumsuz duygumuz olduğunda, kendimize soracağımız"
  }
];

export const tracks: SubtitleTrack[] = [
  { streamIndex: 2, codec: 'subrip', language: 'tur', title: 'Türkçe', kind: 'text' },
  { streamIndex: 3, codec: 'ass', language: 'tur', title: 'Türkçe (ASS)', kind: 'text' },
  { streamIndex: 4, codec: 'hdmv_pgs_subtitle', language: 'eng', title: null, kind: 'picture' },
];

export const cutResults: CutResult[] = [
  {
    path: '/home/kullanici/Videolar/kirpix/tr-tedx-kaygi-000333-000415.mp4',
    durationMs: 41880,
    status: 'ok',
    message: '',
  },
  {
    path: '/home/kullanici/Videolar/kirpix/tr-tedx-kaygi-001340-001406.mp4',
    durationMs: 25200,
    status: 'ok',
    message: '',
  },
];
