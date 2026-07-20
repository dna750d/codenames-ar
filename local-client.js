
let board = null;
let turn = "red";
let view = "board";

const $ = (id) => document.getElementById(id);

$("startLocalBtn").onclick = () => {
  board = CN.createBoard(CN.DEFAULT_WORDS);
  turn = board.turn;
  $("lobby").classList.add("hidden");
  $("game").classList.remove("hidden");
  renderBoard();
  updateTurn();
};

$("restartBtn").onclick = () => {
  board = null;
  $("game").classList.add("hidden");
  $("lobby").classList.remove("hidden");
  $("status").textContent = "";
  $("status").className = "status";
};

$("toggleViewBtn").onclick = () => {
  view = view === "board" ? "spymaster" : "board";
  renderBoard();
};

function updateTurn() {
  const ti = $("turnIndicator");
  ti.className = `turn-indicator ${turn}`;
  ti.textContent = `الدور: الفريق ${turn === "red" ? "الأحمر" : "الأزرق"}`;
}

function renderBoard() {
  const boardEl = $("board");
  boardEl.innerHTML = "";
  if (!board) return;
  board.cells.forEach((c, i) => {
    const cell = document.createElement("div");
    const revealed = c.revealed;
    const showRole = view === "spymaster" || revealed;
    const cls = revealed ? `revealed ${c.role}` : "";
    cell.className = `cell ${cls} ${!revealed ? "clickable" : ""}`;
    cell.textContent = c.word;
    if (!revealed) {
      cell.onclick = () => revealCell(i);
    }
    boardEl.appendChild(cell);
  });
}

function revealCell(index) {
  if (!board) return;
  const cell = board.cells[index];
  if (cell.revealed) return;
  const updated = CN.applyReveal(board, index);
  board = updated;
  if (updated.winner) {
    renderBoard();
    const st = $("status");
    st.className = `status win-${updated.winner}`;
    st.textContent = `فاز الفريق ${updated.winner === "red" ? "الأحمر" : "الأزرق"} 🎉`;
    return;
  }
  if (cell.role !== turn && cell.role !== "neutral") {
    turn = turn === "red" ? "blue" : "red";
  }
  renderBoard();
  updateTurn();
}
