# Contributing to JobSniper

Thank you for your interest in contributing to JobSniper! We welcome contributions from developers, designers, and job seekers worldwide.

## Code of Conduct

Please review and adhere to our [Code of Conduct](CODE_OF_CONDUCT.md) in all interactions within this project.

## How to Contribute

1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/job-sniper.git
   cd job-sniper
   ```
3. Create a descriptive feature branch:
   ```bash
   git checkout -b feature/amazing-new-feature
   ```
4. Follow Conventional Commits:
   * `feat(extension): add support for Workday forms`
   * `fix(tailor): handle missing skills gracefully`
   * `docs(readme): clarify setup instructions`
5. Keep pull requests focused and small (< 400 lines of change).
6. Ensure all unit tests pass before submitting.
7. Open a Pull Request against `main`.

## Development Setup

### Python Backend
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -e ".[dev]"
pytest
```

### Chrome Extension
```bash
npm install
npm run build
```
Load the extension unpacked in Google Chrome via `chrome://extensions` pointing to the `extension/` directory.
