# Attack Shark X3 — Web Driver

An unofficial, browser-based configurator for the **Attack Shark X3** gaming mouse, which ships with no official Linux or web driver. Runs entirely client-side via the [WebHID API](https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API) — no install, no native driver, nothing sent over the network.

**Live:** https://eclipse-5214.github.io/x3web/

> Requires Chrome or Edge (or another Chromium-based browser) — WebHID isn't supported in Firefox or Safari.

## Features

- **DPI stages** — all 6 stages adjustable via slider or exact numeric input, snapped to the nearest 50 DPI, up to 25,600 custom / 26,000 via the sensor's firmware max preset.
- **Polling rate** — 125 / 250 / 500 / 1000 Hz.
- **Wired and 2.4G wireless** — both connection modes supported (not Bluetooth).
- **Installable PWA** — works offline, opens as its own standalone window.
- **Theming** — light/dark/system, plus any accent color via a built-in color picker.
- Remembers your last-set DPI stage and polling rate locally, since the mouse's firmware can't be read back (see below).

## How this exists

Attack Shark doesn't publish a protocol spec, an SDK, or anything beyond a Windows-only configurator app. The HID protocol used here — report IDs, byte layout, checksum — was reverse-engineered by capturing USB traffic from that official app with [USBPcap](https://desowin.org/usbpcap/)/Wireshark while changing settings, then diffing the captured payloads against the exact action taken. The full protocol writeup lives in code comments in [`src/lib/x3protocol.ts`](src/lib/x3protocol.ts).

**Important caveat:** the mouse's vendor HID interface only implements `SET_REPORT` — there's no way to read current settings back from the hardware, not from this driver and not from the official app either. Everything the UI shows is *what was last written*, not a live hardware read. It can go stale if the mouse is reconfigured from elsewhere (the official app, another tab) in between.

## Development

Requires Node.js 20+.

```sh
npm install
npm run dev      # start the dev server at localhost:5173
npm run check    # type-check (svelte-check)
npm run build    # production build -> dist/
npm run preview  # serve the production build locally
```

### Project structure

```
src/
  App.svelte          entry component
  main.ts             app bootstrap
  app.css             Tailwind import + theme tokens
  components/         UI (DpiStageRow, PillButton, SettingsMenu, ColorPicker)
  stores/             reactive app-wide state (theme, accent)
  lib/                framework-agnostic logic (protocol, color math, persistence)
  types/              ambient type declarations (WebHID isn't in TS's DOM lib yet)
```

Built with Svelte 5 + TypeScript, Vite, and Tailwind CSS v4. Deploys to GitHub Pages automatically on push to `main` via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

## Disclaimer

Unofficial, reverse-engineered, provided as-is with no affiliation to Attack Shark. Custom DPI values above 25,600 are deliberately avoided — see the `DPI_MAX` comment in `x3protocol.ts` for why that specific boundary matters.
