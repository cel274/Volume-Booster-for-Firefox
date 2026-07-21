# 🔊 Volume Booster for Firefox

![Firefox Add-on](https://img.shields.io/badge/Firefox-Add--on-FF7139?style=flat-square&logo=firefoxbrowser&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![esbuild](https://img.shields.io/badge/Bundler-esbuild-FFCF00?style=flat-square&logo=esbuild&logoColor=black)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Volume Boost](https://img.shields.io/badge/Boost-up%20to%20600%25-blueviolet?style=flat-square)

Volume Booster for Firefox

A simple yet powerful Firefox extension to control and boost the audio volume of each browser tab individually. This tool provides a centralized panel to manage the volume for all your open tabs, allowing you to boost sound up to 600%.

## ✨ Features

*   **Per-Tab Volume Control:** Adjust the volume for each tab independently.
*   **Volume Boost:** Increase volume up to 600% for tabs that are too quiet.
*   **Simple UI:** An intuitive popup interface lists all your tabs with individual volume sliders. The active tab is always sorted to the top for easy access.
*   **Automatic Detection:** Works with any HTML5 `<audio>` and `<video>` elements on any website.
*   **Tab Identification:** Displays favicons and tab titles to help you quickly identify the correct tab.

## ⚙️ How It Works

This extension is built with TypeScript and `esbuild` for modern browsers.

*   A **content script** (`src/content.ts`) is injected into every webpage. This script finds all `<audio>` and `<video>` elements.
*   It uses the **Web Audio API** (`AudioContext`, `GainNode`) to intercept the audio output from these media elements. A `GainNode` is attached, which allows for programmatic control of the volume.
*   The **popup UI** (`popup.html`, `src/popup.ts`) lists all open tabs. When you adjust a slider, it sends a message to the content script in the corresponding tab to set the new gain (volume) level.

## 📥 Installation

To install this extension manually for development or personal use:

1.  **Clone or Download the Repository**
    ```bash
    git clone https://github.com/cel274/Volume-Booster-for-Firefox.git
    cd Volume-Booster-for-Firefox
    ```

2.  **Install Dependencies and Build**
    You need to have [Node.js](https://nodejs.org/) and npm installed.
    ```bash
    # Install development dependencies
    npm install
    
    # Build the extension source files
    npm run build
    ```
    This command will compile the TypeScript files into JavaScript bundles in the `dist/` directory.

3.  **Load in Firefox**
    *   Open Firefox and navigate to `about:debugging`.
    *   Click on "This Firefox" in the left-hand sidebar.
    *   Click "Load Temporary Add-on...".
    *   Select the `manifest.json` file from the repository's root directory.
    *   The extension icon will appear in your Firefox toolbar.

    *Note: Firefox removes temporary add-ons when you close the browser. You will need to reload it each session.*

## 🕹️ Usage

1.  Click the Volume Booster icon in the Firefox toolbar.
2.  A popup will appear, displaying a list of your open tabs.
3.  Locate the tab you wish to adjust and move its corresponding slider. The volume percentage is shown next to the slider.
4.  Changes are applied instantly to the audio or video playing in that tab.
