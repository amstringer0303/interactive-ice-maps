# Interactive Ice Maps

An interactive web atlas organizing landfast sea ice U-Net model output and supporting analysis for Arctic coastal communities. This was made to easily sort through ice maps, bathymetry data, and variability maps for ~70 Arctic coastal communities using output from a trained U-Net model that automates landfast ice polygon extraction from Sentinel-2 imagery.

It is built as a standalone HTML/JS/CSS site — no server required.

## Contents

- `index.html` — main entry point
- `app.js` — map rendering, pie chart overlays, and interactive sidebar logic
- `styles.css` — layout and styling
- `assets/` — map tile images and community pie chart PNGs
- `data/` — CSV tables (stability metrics, bathymetry, community coordinates)

## Usage

Open `index.html` in a browser. Click any community marker to see ice stability statistics and bathymetric regime breakdown in the sidebar.

**Live site:** https://amstringer0303.github.io/interactive-ice-maps/
