// The whole add-on: receive the team's messages and draw three small summaries.
// No build step; this folder is what the app installs.
import { connect } from "./agmsg-addon.js";

const MAX_SHOWN = 500; // the app sends at most this many on start
const WEEK = 7 * 24 * 3600 * 1000;
let messages = [];

const $ = (id) => document.getElementById(id);
// Message text is untrusted: build nodes and set textContent, never innerHTML.
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}
const empty = (text) => el("p", "empty", text);

function members() {
  const counts = new Map();
  for (const m of messages) counts.set(m.from, (counts.get(m.from) || 0) + 1);
  const rows = [...counts].sort((a, b) => b[1] - a[1]);
  const top = rows.length ? rows[0][1] : 1;
  $("members").replaceChildren(...(rows.length ? rows.map(([name, n]) => {
    const fill = el("div", "fill");
    fill.style.setProperty("--w", (100 * n) / top + "%");
    const track = el("div", "track");
    track.append(fill);
    const row = el("div", "bar");
    row.append(el("span", "name", name), track, el("span", "n", String(n)));
    return row;
  }) : [empty("No messages yet.")]));
}

function hours() {
  const perHour = new Array(24).fill(0);
  const since = Date.now() - WEEK;
  for (const m of messages) {
    const t = new Date(m.created_at);
    if (t.getTime() >= since) perHour[t.getHours()]++; // local time
  }
  const top = Math.max(1, ...perHour);
  const cols = perHour.map((n, h) => {
    const c = el("div", n ? "col" : "col zero");
    c.style.setProperty("--h", (100 * n) / top + "%");
    c.title = String(h).padStart(2, "0") + ":00 · " + n;
    return c;
  });
  $("hours").replaceChildren(...cols);
}

function age(iso) {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
  return min < 60 ? min + " min" : min < 2880 ? Math.round(min / 60) + " h" : Math.round(min / 1440) + " d";
}

// A question is "waiting" when it ends with "?" and its recipient has not
// written anything after it. Broadcasts have no single recipient, so skip them.
function waiting() {
  const names = new Set(messages.map((m) => m.from));
  const out = [];
  messages.forEach((m, i) => {
    if (!m.body.trimEnd().endsWith("?") || !names.has(m.to)) return;
    if (!messages.slice(i + 1).some((r) => r.from === m.to)) out.push(m);
  });
  const rows = out.slice(-10).reverse().map((m) => {
    const li = el("li");
    const who = el("strong", "", m.from);
    const meta = el("div", "meta");
    meta.append(who, " → " + m.to + " · " + age(m.created_at) + " ago");
    li.append(meta, el("div", "first", m.body.split("\n")[0]));
    return li;
  });
  $("waiting").replaceChildren(...(rows.length ? rows : [empty("Nothing is waiting.")]));
}

function render() {
  members();
  hours();
  waiting();
  $("status").textContent = messages.length + " messages";
}

connect({
  onInit({ team, messages: initial }) {
    $("team").textContent = team;
    messages = initial.slice(-MAX_SHOWN);
    render();
  },
  onMessage(m) {
    messages.push(m);
    if (messages.length > MAX_SHOWN) messages.shift();
    render();
  },
});
