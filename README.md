# OUPS_2026 Static MVP Site (v1.0)

## Contents
- index.html (Dashboard)
- scorecard.html (Scorecard)
- backtest.html (Backtest placeholder)
- methodology.html (Methodology)
- assets/oups_config_v1.json + assets/oups_config_v1.yml (config)
- assets/sample_latest.json + assets/sample_history.json (offline sample data)

## Run locally
Because pages fetch JSON, use a local server:

### Python
```bash
python -m http.server 8000
```
Open:
- http://localhost:8000/oups_site/index.html  (if serving /mnt/data)
or serve the folder directly.

### Switch to API mode
Edit `app.js`:
- set `DATA_MODE = "api"`
- adjust endpoints in `API`
