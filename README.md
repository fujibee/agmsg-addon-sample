# agmsg add-on sample

A small [agmsg](https://github.com/fujibee/agmsg) app add-on, and the starting point for writing your own. It adds a **Team timeline** pane to the agmsg desktop app: the team's messages, newest first, with a message count per member.

## Try it

In the agmsg app, open **Settings → Add-ons**, enter `fujibee/agmsg-addon-sample` and press **Install…**. Review the permission it asks for (read the team's messages), then open it from **＋ New ▾ → Add-on pane ▸ Team timeline**.

## What an add-on is

```
agmsg-plugin.conf              name, description
app-panes/<name>/
  addon.conf                   title, entry, permissions (key = value, data only)
  web/                         the built pane, committed; entry web/index.html
```

The app serves `web/` to a sandboxed frame. The pane gets only what `addon.conf` declares and the user allows:

| Permission      | What the pane can do                                        |
| --------------- | ----------------------------------------------------------- |
| `messages:read` | receive the team's messages                                 |
| `files:read`    | list and read files in a folder the user picks              |
| `git:read`      | read git status, log and diffs there (needs `files:read`)   |
| `network`       | reach the origins listed in `network = https://…` (or `*`)  |

Each declared permission needs a `why.<permission> = …` line; users see it next to the request. A pane that declares `network` cannot read `.env` files.

Inside the frame there is no storage, no `eval`, no inline event handlers, no popups or navigation, and no scripts from the network. Code runs only from files in `web/`.

## Make your own

1. Use this repository as a template (or copy it).
2. Rename `app-panes/timeline/` and edit `agmsg-plugin.conf` and `addon.conf`.
3. Write the pane in `web/`. `kit/agmsg-addon.js` is the only file it needs to talk to the app:

   ```js
   import { connect } from "./agmsg-addon.js";
   connect({
     onInit({ team, members, messages }) { /* first load */ },
     onMessage(message) { /* one new message */ },
   });
   ```

   Opened in a normal browser (outside the app), it serves sample data after one second, so you can build and style the pane with any dev server. Types are in `kit/protocol.d.ts`.

   If your pane has a build step, build it and copy the output with `node kit/agmsg-addon-copy.mjs <build-dir> <name>`, then commit `web/`. The app installs exactly what is committed.

4. Check it: `node kit/agmsg-addon-check.cjs`. It refuses what the app would refuse (layout, `addon.conf`, links, size limits) and reports what the sandbox will block. The workflow in `.github/workflows/check.yml` runs it on every push.
5. Load it while you work: **Settings → Add-ons → Developer → Load from folder…**, then push the repository to GitHub and install it by `owner/repo`.

Porting an existing web app? Hand `kit/PORTING-PROMPT.md` to your coding agent.

## The kit

`kit/` is copied from the agmsg app (`app/addon-kit/`) and versioned with it. Copy a newer kit from there rather than editing these files.

## License

MIT
