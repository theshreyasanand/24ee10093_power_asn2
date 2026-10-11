# Diode Bridge & Thyristor Controlled Rectifier Studio

**Shreyas' In Class Assignment (24EE10093)** – Power Electronics Assignment 2

An interactive web app for exploring single-phase diode bridge and thyristor (SCR) controlled rectifiers, with a live schematic and real-time waveforms.

🔗 **Live site:** https://theshreyasanand.github.io/24ee10093_power_asn2/

## How it was made

1. The website was first built on **Google AI Studio**.
2. It was then passed to **Claude** to bundle everything into a single, all-in-one `index.html` file.

## Repo structure

| Path | Description |
|------|-------------|
| `index.html` | The all-in-one version of the website (this is what is deployed on GitHub Pages) |
| `ai-studio/` | The full original codebase from AI Studio |

Repo: https://github.com/theshreyasanand/24ee10093_power_asn2

## How to run

**Easiest:** open the live link above.

**Locally (all-in-one file):**
1. Clone or download the repo.
2. Double-click `index.html` to open it in your browser (internet is needed once for the Google Fonts).

```bash
git clone https://github.com/theshreyasanand/24ee10093_power_asn2.git
cd 24ee10093_power_asn2
# then open index.html in a browser
```

**Running the original AI Studio source:**
```bash
cd ai-studio
npm install
npm run dev
```

## Features

- Diode bridge (R and RL load) and thyristor-controlled rectifier modes
- Adjustable firing angle slider with a reset to 0°
- Optional freewheeling diode across the load
- Live circuit schematic with full-screen view
- Waveforms for source voltage, input current, output voltage and output current, shown superimposed or as separate channels
- Zoom, scrub-to-inspect, grid and average-line toggles
- Measurements: average and RMS voltage/current, ripple factor, current THD
- Harmonic spectrum (DFT)
- Lab presets, dark theme and reset simulation
