// منطق اللعبة — يعمل في المتصفح (بدون خادم)
const DEFAULT_WORDS = [
  "أسد","بحر","شمس","قمر","نجم","شجرة","وردة","جبل","نهر","سحابة",
  "نار","ثلج","ريح","مطر","صحراء","جزيرة","وادي","غابة","حديقة","زهرة",
  "كتاب","قلم","ورقة","مكتب","ساعة","هاتف","حاسوب","شاشة","كاميرا","راديو",
  "سيارة","قطار","طائرة","سفينة","دراجة","طريق","جسر","مطار","ميناء","محطة",
  "بيت","غرفة","نافذة","باب","سقف","جدار","مفتاح","قفل","سلم","شرفة",
  "خبز","ماء","ملح","سكر","عسل","قهوة","شاي","لبن","جبن","تفاح",
  "برتقال","عنب","موز","ليمون","طماطم","بطاطا","جزر","خيار","بصل","ثوم",
  "كلب","قطة","حصان","بقرة","غنم","أرنب","طير","سمك","نحلة","فراشة",
  "ملك","ملكة","أمير","جندي","شرطي","طبيب","معلم","مهندس","فلاح","تاجر",
  "حرب","سلام","علم","راية","قلعة","سيف","درع","قوس","سهم","رمح",
  "حب","صداقة","فرح","حزن","غضب","خوف","أمل","حلم","ذكرى","سر",
  "موسيقى","غناء","رقص","لوحة","تمثال","مسرح","فيلم","قصة","شعر","لون",
  "ذهب","فضة","نحاس","حديد","زجاج","خشب","حجر","رمل","طين","فحم",
  "صيف","شتاء","ربيع","خريف","يوم","ليل","صباح","مساء","سنة","شهر",
  "عين","يد","قلب","رأس","قدم","صوت","ضحكة","دمعة","ظل","نور",
  "سوق","متجر","مصنع","مزرعة","مدرسة","جامعة","مكتبة","متحف","مسجد","كنيسة"
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomId(len = 4) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < len; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// إنشاء لوحة: 25 كلمة + توزيع الألوان الكلاسيكي (أحمر يبدأ: 9/8/7/1)
export function createBoard(wordPool) {
  const pool = wordPool.length >= 25 ? wordPool : [...wordPool, ...DEFAULT_WORDS];
  const words = shuffle(pool).slice(0, 25);
  const startTeam = "red";
  const roles = [];
  for (let i = 0; i < (startTeam === "red" ? 9 : 8); i++) roles.push("red");
  for (let i = 0; i < (startTeam === "red" ? 8 : 9); i++) roles.push("blue");
  for (let i = 0; i < 7; i++) roles.push("neutral");
  roles.push("assassin");
  const assigned = shuffle(roles);
  const cells = words.map((word, i) => ({ word, role: assigned[i], revealed: false }));
  return { cells, startTeam, turn: startTeam };
}

// تطبيق كشف على نسخة من اللوحة وإرجاع الحالة الجديدة
export function applyReveal(board, index) {
  if (!board) return null;
  const cell = board.cells[index];
  if (!cell || cell.revealed) return board;
  const cells = board.cells.map((c, i) => (i === index ? { ...c, revealed: true } : c));
  let turn = board.turn;
  let winner = board.winner || null;
  const newBoard = { ...board, cells };

  if (cell.role === "assassin") {
    winner = turn === "red" ? "blue" : "red";
  } else if (cell.role === "red" && cells.filter((c) => c.role === "red" && c.revealed).length === 9) {
    winner = "red";
  } else if (cell.role === "blue" && cells.filter((c) => c.role === "blue" && c.revealed).length === 8) {
    winner = "blue";
  }
  if (!winner && cell.role !== turn && cell.role !== "neutral") {
    turn = turn === "red" ? "blue" : "red";
  }
  newBoard.turn = turn;
  newBoard.winner = winner;
  return newBoard;
}

// كشف الدوال للاستخدام من client.js (سكربت كلاسيكي)
window.CN = { DEFAULT_WORDS, createBoard, applyReveal, shuffle, randomId };
