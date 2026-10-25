// The whole add-on: receive the team's messages from the app and draw them.
// No build step; this folder is what the app installs.
import { connect } from "./agmsg-addon.js";

const MAX_SHOWN = 500;
const messages = [];

const $ = (id) => document.getElementById(id);

function time(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function renderMembers() {
  const counts = new Map();
  for (const m of messages) counts.set(m.from, (counts.get(m.from) || 0) + 1);
  const box = $("members");
  box.replaceChildren(
    ...[...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, n]) => {
        const el = document.createElement("span");
        el.className = "member";
        el.append(name + " ");
        const b = document.createElement("b");
        b.textContent = String(n);
        el.append(b);
        return el;
      }),
  );
}

function item(m) {
  const li = document.createElement("li");
  const meta = document.createElement("div");
  meta.className = "meta";
  const from = document.createElement("strong");
  from.textContent = m.from;
  meta.append(from, " → " + m.to + " · " + time(m.created_at));
  const body = document.createElement("div");
  body.className = "body";
  // textContent, never innerHTML: message bodies are untrusted text.
  body.textContent = m.body + (m.truncated ? " …" : "");
  li.append(meta, body);
  return li;
}

function renderAll() {
  $("timeline").replaceChildren(...messages.slice().reverse().map(item));
  renderMembers();
  $("status").textContent = messages.length + " messages";
}

connect({
  onInit({ team, messages: initial }) {
    $("team").textContent = team;
    messages.splice(0, messages.length, ...initial.slice(-MAX_SHOWN));
    renderAll();
  },
  onMessage(m) {
    messages.push(m);
    if (messages.length > MAX_SHOWN) {
      messages.shift();
      $("timeline").lastElementChild?.remove();
    }
    $("timeline").prepend(item(m));
    renderMembers();
    $("status").textContent = messages.length + " messages";
  },
});
