const ws = new WebSocket(`ws://${location.host}`);
let myRoom = null;
let lastState = null;

const $ = (id) => document.getElementById(id);
const screens = { lobby: $("lobby"), waiting: $("waiting"), game: $("game") };

function show(name) {
  for (const k in screens) screens[k].classList.toggle("hidden", k !== name);
}

function send(obj) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}

ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.type === "room") {
    myRoom = msg.id;
    $("roomCode").textContent = msg.id;
    show("waiting");
    renderWaiting(lastState);
  } else if (msg.type === "state") {
    lastState = msg.state;
    handleState(msg.state);
  } else if (msg.type === "error") {
    alert(msg.message);
  }
};

// الدخول
$("createBtn").onclick = () => send({ type: "create", name: $("nameInput").value.trim() });
$("joinBtn").onclick = () => {
  const room = $("roomInput").value.trim().toUpperCase();
  if (room) send({ type: "join", room, name: $("nameInput").value.trim() });
};

function handleState(s) {
  if (s.state === "lobby") {
    show("waiting");
    renderWaiting(s);
  } else {
    show("game");
    renderGame(s);
  }
}

function renderWaiting(s) {
  if (!s) return;
  // قائمة اللاعبين
  const list = $("playerList");
  list.innerHTML = "";
  s.players.forEach((p) => {
    const div = document.createElement("div");
    div.className = "player-chip";
    const tagClass = p.role === "spymaster" ? "tag-sm" : p.team === "red" ? "tag-red" : p.team === "blue" ? "tag-blue" : "tag-none";
    const tagText = p.role === "spymaster" ? "ضابط" : p.team === "red" ? "أحمر" : p.team === "blue" ? "أزرق" : "بدون";
    div.innerHTML = `<span>${p.name}${s.host && p.name === s.players.find(x=>x)?.name ? " 👑" : ""}</span><span class="team-tag ${tagClass}">${tagText}</span>`;
    list.appendChild(div);
  });

  // لوحة المضيف
  if (s.host) {
    $("hostPanel").classList.remove("hidden");
    renderAssign(s);
  } else {
    $("hostPanel").classList.add("hidden");
  }
}

function renderAssign(s) {
  const area = $("assignArea");
  area.innerHTML = "";
  s.players.forEach((p) => {
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
  const words = $("customWords").value.split("\n").map((w) => w.trim()).filter(Boolean);
  send({ type: "setCustomWords", words });
};

$("startBtn").onclick = () => {
  const assignments = {};
  document.querySelectorAll("#assignArea select").forEach((sel) => {
    if (sel.value) {
      const [team, role] = sel.value.split("-");
      assignments[sel.dataset.name] = { team, role };
    }
  });
  send({ type: "assignRoles", assignments });
  send({ type: "start" });
};

function renderGame(s) {
  // معلومات الدور
  const ri = $("roleInfo");
  if (s.you && s.you.team) {
    ri.className = `role-info ${s.you.team} ${s.you.role}`;
    ri.textContent = `فريقك: ${s.you.team === "red" ? "الأحمر" : "الأزرق"}`;
  } else {
    ri.className = "role-info";
    ri.textContent = "مشاهد";
  }

  // الدور الحالي
  const tb = $("turnBadge");
  if (s.board) {
    tb.className = `turn-badge turn-${s.board.turn}`;
    tb.textContent = `دور: ${s.board.turn === "red" ? "الأحمر" : "الأزرق"}`;
  }

  // اللوحة
  const board = $("board");
  board.innerHTML = "";
  const canReveal = s.you && s.you.role === "spymaster" && s.state === "playing";
  s.board.cells.forEach((c, i) => {
    const cell = document.createElement("div");
    const revealed = c.revealed;
    const cls = revealed ? `revealed ${c.role}` : "";
    cell.className = `cell ${cls} ${canReveal && !revealed ? "clickable" : ""}`;
    cell.textContent = c.word;
    if (canReveal && !revealed) {
      cell.onclick = () => send({ type: "reveal", index: i });
    }
    board.appendChild(cell);
  });

  // الحالة
  const st = $("status");
  if (s.state === "finished" && s.winner) {
    st.className = `status win-${s.winner}`;
    st.textContent = `فاز الفريق ${s.winner === "red" ? "الأحمر" : "الأزرق"} 🎉`;
  } else {
    st.className = "status";
    st.textContent = "";
  }

  // زر الخروج للمضيف لإعادة الضبط
}

$("leaveBtn").onclick = () => {
  location.reload();
};

ws.onclose = () => alert("انقطع الاتصال بالخادم");
