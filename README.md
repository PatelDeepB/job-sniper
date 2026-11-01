# JobSniper

> Autonomous AI career agent: real-time ATS job sniper (<15m), dynamic keyword-tailored resume compiler (95%+ ATS score), and 1-click recruiter direct outreach.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/PatelDeepB/job-sniper/actions/workflows/ci.yml/badge.svg)](https://github.com/PatelDeepB/job-sniper/actions/workflows/ci.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/)
[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-orange.svg)](https://developer.chrome.com/docs/extensions/mv3/)

---

## The Problem

Most auto-apply tools (like LazyApply) blast 500 identical generic resumes onto job boards. This triggers bot detection, gets user accounts banned, and leads to an interview rate below 0.5%.

Meanwhile, "passive copilots" (like Simplify) require users to spend hours manually searching for jobs, opening 50 tabs, and clicking "submit" on every single page.

**JobSniper is built differently. It focuses on the interview conversion rate, not raw spam volume.**

---

## The 3-Part Unfair Advantage

| Feature | LazyApply | Simplify | JobSniper (Our Engine) |
| :--- | :--- | :--- | :--- |
| **Speed to Apply** | Manual search | Manual search | **Snipes postings <15 mins old** |
| **Resume Strategy** | Static generic PDF | Static generic PDF | **Dynamic keyword re-ordering per JD** |
| **ATS Match Score** | 30% to 50% | 40% to 60% | **90%+ Guaranteed ATS Match** |
| **Bot Detection Safety** | High risk (Banned accounts) | Safe (Manual human clicks) | **Safe (Human-paced in local browser)** |
| **Recruiter Touch** | None | None | **1-Click personalized InMail/DM** |
| **Pricing** | $99 to $250 upfront lock-in | Free / Freemium | **Pay-as-you-go ($15 for 100 snipes)** |

---

## System Architecture

JobSniper uses an **Open-Core architecture**:
* **Client (Open Source):** A lightweight Manifest V3 Chrome Extension executing inside the user's browser (using the user's residential IP and session cookies to eliminate bot flags).
* **Intelligence Engine (Cloud API):** Fast microservice running real-time Greenhouse and Lever RSS/API scrapers, dynamic ATS resume restructuring, and recruiter LinkedIn intelligence.

---

## Quick Start Guide

### 1. Chrome Extension Setup
```bash
# Clone the repository
git clone https://github.com/PatelDeepB/job-sniper.git
cd job-sniper

# Install dependencies and build extension
npm install
npm run build
```
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (top right toggle).
3. Click **Load unpacked** and select the `extension/` directory.

### 2. Backend Engine Setup (Optional / Local Development)
```bash
# Set up virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies in editable mode
pip install -e ".[dev]"

# Run tests
pytest
```

---

## License

This project is licensed under the [MIT License](LICENSE).
