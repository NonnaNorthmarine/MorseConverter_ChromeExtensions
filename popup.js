// --- 基本定義 (内部的にはすべて標準の . - で管理します) ---
const jpBase = {
  'イ': '.-', 'ロ': '.-.-', 'ハ': '-...', 'ニ': '-.-.', 'ホ': '-..',
  'ヘ': '.', 'ト': '..-..', 'チ': '..-.', 'リ': '--.', 'ヌ': '....',
  'ル': '-.--.', 'ヲ': '.---', 'ワ': '-.-', 'カ': '.-..', 'ヨ': '--',
  'タ': '-.', 'レ': '---', 'ソ': '---.', 'ツ': '.--.', 'ネ': '--.-',
  'ナ': '.-.', 'ラ': '...', 'ム': '-', 'ウ': '..-', 'ヰ': '.-..-',
  'ノ': '..--', 'オ': '.-...', 'ク': '...-', 'ヤ': '.--', 'マ': '-..-',
  'ケ': '-.--', 'フ': '--..', 'コ': '----', 'エ': '-.---', 'テ': '.-.--',
  'ア': '--.--', 'サ': '-.-.-', 'キ': '-.-..', 'ユ': '-..--', 'メ': '-...-',
  'ミ': '..-.-', 'シ': '--.-.', 'ヱ': '.--..', 'ヒ': '--..-', 'モ': '-..-.',
  'セ': '.---.', 'ス': '---.-', 'ン': '.-.-.',
  '゛': '..', '゜': '..--.', 'ー': '.--.-', '、': '.-.-.-',
  '（': '-.--.-', '）': '.-..-.',
};

const enBase = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.',
  'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
  'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---',
  'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
  'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--', 'Z': '--..',
  '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....',
  '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', '/': '-..-.', '-': '-....-'
};

// 逆引き用マップ（復号時に使用）
const reverseJp = Object.fromEntries(Object.entries(jpBase).map(([k, v]) => [v, k]));
const reverseEn = Object.fromEntries(Object.entries(enBase).map(([k, v]) => [v, k]));

// 濁音・半濁音の分解マップ
const dakutenMap = {
  'ガ': ['カ', '゛'], 'ギ': ['キ', '゛'], 'グ': ['ク', '゛'], 'ゲ': ['ケ', '゛'], 'ゴ': ['コ', '゛'],
  'ザ': ['サ', '゛'], 'ジ': ['シ', '゛'], 'ズ': ['ス', '゛'], 'ゼ': ['セ', '゛'], 'ゾ': ['ソ', '゛'],
  'ダ': ['タ', '゛'], 'ヂ': ['チ', '゛'], 'ヅ': ['ツ', '゛'], 'デ': ['テ', '゛'], 'ド': ['ト', '゛'],
  'バ': ['ハ', '゛'], 'ビ': ['ヒ', '゛'], 'ブ': ['フ', '゛'], 'ベ': ['ヘ', '゛'], 'ボ': ['ホ', '゛'],
  'パ': ['ハ', '゜'], 'ピ': ['ヒ', '゜'], 'プ': ['フ', '゜'], 'ペ': ['ヘ', '゜'], 'ポ': ['ホ', '゜'],
  'ヴ': ['ウ', '゛']
};

// 文字種判定用正規表現
const regexJp = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF]/; // ひらがな・カタカナ・全角記号
// const regexEn = /[a-zA-Z\.\,\?\/\-]/; // 英字記号 (数字は文脈依存なので含めない)

document.addEventListener('DOMContentLoaded', () => {
  const inputEl = document.getElementById('inputText');
  const outputEl = document.getElementById('outputMorse');
  
  // --- テキスト → モールス変換 ---
  document.getElementById('toMorseBtn').addEventListener('click', () => {
    let text = inputEl.value.toUpperCase();
    // ひらがなをカタカナに統一（内部処理用）
    text = text.replace(/[\u3041-\u3096]/g, ch => String.fromCharCode(ch.charCodeAt(0) + 0x60));
    
    let result = [];
    // 現在のモード: 'JP' (和文) または 'EN' (欧文)。初期値はENとしておくが最初の一文字で判定
    let currentMode = 'JP'; 

    for (let char of text) {
      if (char === ' ' || char === '　' || char === '\n') {
        result.push(currentMode === 'JP' ? '　' : ' '); // モードに合わせた空白を入れる
        continue;
      }

      // 処理する文字リストを作成（濁点付きなら2文字になる）
      let charsToProcess = [];
      if (dakutenMap[char]) {
        charsToProcess = dakutenMap[char];
      } else {
        charsToProcess = [char];
      }

      charsToProcess.forEach(c => {
        let code = null;
        
        // 1. 和文判定
        if (jpBase[c]) {
          code = jpBase[c];
          currentMode = 'JP'; // 和文モードへ
        } 
        // 2. 欧文判定 (数字もここに含まれるが、数字の場合はモードを変えない)
        else if (enBase[c]) {
          code = enBase[c];
          // 数字の場合はモードを維持、それ以外の英字ならENモードへ
          if (!/[0-9]/.test(c)) {
            currentMode = 'EN';
          }
        } else {
          code = '?';
        }

        // 変換処理
        if (code !== '?') {
          if (currentMode === 'JP') {
            // 和文スタイル: . -> ・ / - -> － / 区切り -> 全角空白
            const styleCode = code.replace(/\./g, '・').replace(/\-/g, '－');
            result.push(styleCode + '　');
          } else {
            // 欧文スタイル: . -> . / - -> - / 区切り -> 半角空白
            result.push(code + ' ');
          }
        } else {
          result.push('? ');
        }
      });
    }
    // 最後の余分な空白を除去
    outputEl.value = result.join('').trimEnd();
  });

  // --- モールス → テキスト復号 ---
  document.getElementById('toTextBtn').addEventListener('click', () => {
    // 全角空白と半角空白の両方で分割する
    const rawText = outputEl.value;
    // 分割時に区切り文字が何だったかを知るのは難しいので、
    // 単純に「空白類」でsplitし、各コードの見た目で和文/欧文を判断する
    const morseTokens = rawText.split(/[\s　]+/); 
    
    let result = '';
    
    morseTokens.forEach(token => {
      if (!token) return;

      // 和文スタイル判定 (「・」か「－」が含まれていれば和文)
      if (token.includes('・') || token.includes('－')) {
        // 標準形式に戻して検索
        const normalized = token.replace(/・/g, '.').replace(/－/g, '-');
        if (reverseJp[normalized]) {
          result += reverseJp[normalized];
        } else {
          result += '?';
        }
      } 
      // 欧文スタイル判定
      else {
        if (reverseEn[token]) {
          result += reverseEn[token];
        } else {
          // 不明、あるいは記号の可能性
          result += '?';
        }
      }
    });

    // 濁点・半濁点の結合処理 (カ゛ -> ガ)
    const combinationMap = Object.entries(dakutenMap).reduce((acc, [merged, parts]) => {
      acc[parts[0] + parts[1]] = merged;
      return acc;
    }, {});

    for (const [key, val] of Object.entries(combinationMap)) {
      result = result.split(key).join(val);
    }

    inputEl.value = result;
  });

  // クリアボタン
  document.getElementById('clearBtn').addEventListener('click', () => {
    inputEl.value = '';
    outputEl.value = '';
  });
});