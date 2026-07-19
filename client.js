// العميل — يتزامن عبر Firebase Realtime Database
window.addEventListener("error", (e) => {
  const el = document.getElementById("status");
  if (el) { el.className = "status"; el.textContent = "خطأ: " + (e.message || e.error); }
});

function showErr(msg) {
  const el = document.getElementById("status");
  if (el) { el.className = "status"; el.textContent = "خطأ: " + msg; }
}

if (typeof firebase === "undefined" || !db) {
  showErr("لم يتم تحميل Firebase — تحقق من اتصال الإنترنت أو firebase-config.js");
}
const roomsRef = db.ref("rooms");
let myRoomId = null;
let myName = "";
let isHost = false;
let myRole = null;
let myTeam = null;
let lastState = null;

const $ = (id) => document.getElementById(id);
const screens = { lobby: $("lobby"), waiting: $("waiting"), game: $("game") };
function show(name) {
  for (const k in screens) screens[k].classList.toggle("hidden", k !== name);
}

function roomRef(id) {
  return db.ref("rooms/" + id);
}

// الدخول
$("createBtn").onclick = () => {
  if (typeof CN === "undefined") { showErr("game.js لم يُحمّل"); return; }
  if (!db) { showErr("Firebase غير متصل"); return; }
  try {
    myName = $("nameInput").value.trim() || "لاعب";
    const id = CN.randomId();
    myRoomId = id;
    isHost = true;
    roomRef(id).set({
      host: myName,
      state: "lobby",
      players: { [myName]: { name: myName, role: null, team: null } },
      customWords: [],
      board: null,
      winner: null,
    });
    listenRoom(id);
    show("waiting");
  } catch (err) {
    showErr(err.message);
  }
};

$("joinBtn").onclick = () => {
  const id = $("roomInput").value.trim().toUpperCase();
  myName = $("nameInput").value.trim() || "لاعب";
  if (!id) return;
  roomRef(id).once("value", (snap) => {
    if (!snap.exists()) {
      alert("الغرفة غير موجودة");
      return;
    }
    myRoomId = id;
    isHost = false;
    const players = snap.val().players || {};
    players[myName] = { name: myName, role: null, team: null };
    roomRef(id).child("players").set(players);
    listenRoom(id);
    show("waiting");
  });
};

function listenRoom(id) {
  roomRef(id).on("value", (snap) => {
    const s = snap.val();
    if (!s) return;
    lastState = s;
    if (s.state === "lobby") {
      show("waiting");
      renderWaiting(s);
    } else {
      show("game");
      renderGame(s);
    }
  });
}

function renderWaiting(s) {
  $("roomCode").textContent = myRoomId;
  const list = $("playerList");
  list.innerHTML = "";
  Object.values(s.players || {}).forEach((p) => {
    const div = document.createElement("div");
    div.className = "player-chip";
    const tagClass = p.role === "spymaster" ? "tag-sm" : p.team === "red" ? "tag-red" : p.team === "blue" ? "tag-blue" : "tag-none";
    const tagText = p.role === "spymaster" ? "ضابط" : p.team === "red" ? "أحمر" : p.team === "blue" ? "أزرق" : "بدون";
    const crown = s.host === p.name ? " 👑" : "";
    div.innerHTML = `<span>${p.name}${crown}</span><span class="team-tag ${tagClass}">${tagText}</span>`;
    list.appendChild(div);
  });

  if (isHost) {
    $("hostPanel").classList.remove("hidden");
    renderAssign(s);
  } else {
    $("hostPanel").classList.add("hidden");
  }
}

function renderAssign(s) {
  const area = $("assignArea");
  area.innerHTML = "";
  Object.values(s.players || {}).forEach((p) => {
    const row = document.createElement("div");
    row.className = "assign-row";
    row.innerHTML = `
      <span>${p.name}</span>
      <select data-name="${p.name}">
        <option value="">اختر</option>
        <option value="red-spymaster">أحمر - ضابط</option>
        <option value="red-operative">أحمر - عميل</option>
        <option value="blue-spymaster">أزرق - ضابط</option>
        <option value="blue-operative">أزرق - عميل</option>
      </select>`;
    const sel = row.querySelector("select");
    if (p.team && p.role) sel.value = `${p.team}-${p.role}`;
    area.appendChild(row);
  });
}

$("customWords").onchange = () => {
  const words = $("customWords").value.split("\n").map((w) => w.trim()).filter(Boolean).slice(0, 50);
  if (isHost) roomRef(myRoomId).child("customWords").set(words);
};

$("startBtn").onclick = () => {
  if (!isHost) return;
  const assignments = {};
  document.querySelectorAll("#assignArea select").forEach((sel) => {
    if (sel.value) {
      const [team, role] = sel.value.split("-");
      assignments[sel.dataset.name] = { team, role };
    }
  });
  const s = lastState;
  const players = { ...s.players };
  for (const name in assignments) {
    if (players[name]) players[name] = { ...players[name], ...assignments[name] };
  }
  const pool = [...CN.DEFAULT_WORDS];
  if (s.customWords && s.customWords.length) pool.push(...s.customWords);
  const board = CN.createBoard(pool);
  roomRef(myRoomId).update({ players, board, state: "playing", winner: null });
};

$("resetBtn").onclick = () => {
  if (isHost) roomRef(myRoomId).update({ state: "lobby", board: null, winner: null });
};

function renderGame(s) {
  const me = s.players && s.players[myName];
  myRole = me ? me.role : null;
  myTeam = me ? me.team : null;

  const ri = $("roleInfo");
  if (myTeam) {
    ri.className = `role-info ${myTeam} ${myRole}`;
    ri.textContent = `فريقك: ${myTeam === "red" ? "الأحمر" : "الأزرق"}`;
  } else {
    ri.className = "role-info";
    ri.textContent = "مشاهد";
  }

  const tb = $("turnBadge");
  if (s.board) {
    tb.className = `turn-badge turn-${s.board.turn}`;
    tb.textContent = `دور: ${s.board.turn === "red" ? "الأحمر" : "الأزرق"}`;
  }

  const board = $("board");
  board.innerHTML = "";
  const canReveal = myRole === "spymaster" && !s.winner;
  s.board.cells.forEach((c, i) => {
    const cell = document.createElement("div");
    const cls = c.revealed ? `revealed ${c.role}` : "";
    cell.className = `cell ${cls} ${canReveal && !c.revealed ? "clickable" : ""}`;
    cell.textContent = c.word;
    if (canReveal && !c.revealed) {
      cell.onclick = () => {
        const updated = CN.applyReveal(s.board, i);
        const patch = { cells: updated.cells, turn: updated.turn };
        if (updated.winner) patch.winner = updated.winner;
        roomRef(myRoomId).child("board").update(patch);
      };
    }
    board.appendChild(cell);
  });

  if (isHost) $("resetBtn").classList.remove("hidden");

  const st = $("status");
  if (s.winner) {
    st.className = `status win-${s.winner}`;
    st.textContent = `فاز الفريق ${s.winner === "red" ? "الأحمر" : "الأزرق"} 🎉`;
  } else {
    st.className = "status";
    st.textContent = "";
  }
}

$("leaveBtn").onclick = () => {
  if (myRoomId) roomRef(myRoomId).child("players/" + myName).remove();
  location.reload();
};
