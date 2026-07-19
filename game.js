import { DEFAULT_WORDS } from "./words.js";

// أدوات مساعدة
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

// إنشاء لوحة جديدة: 25 كلمة + توزيع الألوان الكلاسيكي
// 9 للمبتدئ (الفريق الذي يبدأ)، 8 للفريق الآخر، 7 مدنيين، 1 قاتل
export function createBoard(wordPool) {
  const pool = wordPool.length >= 25 ? wordPool : [...wordPool, ...DEFAULT_WORDS];
  const words = shuffle(pool).slice(0, 25);

  // من يبدأ؟ الفريق الأحمر يبدأ عادة، لكن نجعله عشوائياً أحياناً — نثبته على الأحمر للمبتدئ
  const startTeam = "red";
  const roles = [];
  for (let i = 0; i < (startTeam === "red" ? 9 : 8); i++) roles.push("red");
  for (let i = 0; i < (startTeam === "red" ? 8 : 9); i++) roles.push("blue");
  for (let i = 0; i < 7; i++) roles.push("neutral");
  roles.push("assassin");

  const assigned = shuffle(roles);
  const cells = words.map((word, i) => ({
    word,
    role: assigned[i],
    revealed: false,
  }));

  return { cells, startTeam, turn: startTeam };
}

// حالة اللعبة داخل كل غرفة
export class GameRoom {
  constructor(id) {
    this.id = id;
    this.players = new Map(); // ws -> { name, role, team }
    this.host = null;
    this.state = "lobby"; // lobby | playing | finished
    this.customWords = [];
    this.board = null;
    this.winner = null;
  }

  addPlayer(ws, name) {
    const player = { name: name || "لاعب", role: null, team: null, ws };
    this.players.set(ws, player);
    if (!this.host) this.host = ws;
    return player;
  }

  removePlayer(ws) {
    this.players.delete(ws);
    if (this.host === ws) this.host = this.players.keys().next().value || null;
  }

  playerList() {
    return [...this.players.values()].map((p) => ({
      name: p.name,
      role: p.role,
      team: p.team,
    }));
  }

  setRoles(assignments) {
    for (const [ws, p] of this.players) {
      const a = assignments[p.name];
      if (a) {
        p.team = a.team;
        p.role = a.role;
      }
    }
  }

  startGame() {
    const pool = [...DEFAULT_WORDS];
    if (this.customWords.length) pool.push(...this.customWords);
    this.board = createBoard(pool);
    this.state = "playing";
    this.winner = null;
  }

  reveal(index) {
    if (!this.board || this.state !== "playing") return null;
    const cell = this.board.cells[index];
    if (!cell || cell.revealed) return null;
    cell.revealed = true;

    if (cell.role === "assassin") {
      this.state = "finished";
      this.winner = this.board.turn === "red" ? "blue" : "red";
    } else if (cell.role === "red") {
      if (this.board.cells.filter((c) => c.role === "red" && c.revealed).length === 9) {
        this.state = "finished";
        this.winner = "red";
      }
    } else if (cell.role === "blue") {
      if (this.board.cells.filter((c) => c.role === "blue" && c.revealed).length === 8) {
        this.state = "finished";
        this.winner = "blue";
      }
    }

    // تبديل الدور فقط إذا لم تنكشف كلمة فريقك
    if (this.state === "playing" && cell.role !== this.board.turn && cell.role !== "neutral") {
      this.board.turn = this.board.turn === "red" ? "blue" : "red";
    }
    return cell;
  }

  publicState(forWs) {
    const p = this.players.get(forWs);
    const spectator = !p || !p.role;
    return {
      id: this.id,
      state: this.state,
      host: this.host === forWs,
      players: this.playerList(),
      customWords: this.customWords,
      board: this.board
        ? {
            cells: this.board.cells.map((c) => {
              // الضابط يرى كل شيء، اللاعب العادي يرى المكشوف فقط
              if (spectator) {
                return { word: c.word, revealed: c.revealed };
              }
              return { word: c.word, role: c.role, revealed: c.revealed };
            }),
            turn: this.board.turn,
            startTeam: this.board.startTeam,
          }
        : null,
      winner: this.winner,
      you: p ? { name: p.name, role: p.role, team: p.team } : null,
    };
  }
}

export { randomId, shuffle };
