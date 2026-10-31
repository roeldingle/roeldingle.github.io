---
name: frontend-local-preview
description: "Run the frontend locally: lint, build, start the Vite preview server, and open it in Google Chrome. Use when asked to run, preview, or verify this project's frontend locally."
argument-hint: "Optional: provide a preview URL if using a non-default port"
user-invocable: true
---

# Run Frontend Preview

Use this workflow when the user invokes `/frontend-local-preview` or asks to run or preview this project's frontend locally.

## Procedure

1. From the repository root, run `npm run lint` in `frontend`. If it fails, report the failure and stop; do not start the preview.
2. Run `npm run build` in `frontend`. If it fails, report the failure and stop; do not start the preview.
3. Start `npm run preview -- --host 127.0.0.1` in `frontend` as a persistent background process or terminal task. Keep it running so the user can continue using the preview. Use the local URL printed by Vite; its default is `http://localhost:4173/`, but Vite may select another port if that one is busy.
4. Verify the printed URL responds successfully before opening it. If the preview does not become available, report the error rather than opening a non-working page.
5. Open that exact URL in Google Chrome on Windows, for example with `Start-Process chrome.exe -ArgumentList '<preview-url>'`. If `chrome.exe` is not on `PATH`, check the standard Chrome install locations under `C:\Program Files\Google\Chrome\Application\chrome.exe` and `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`. If Chrome cannot be found or launched, report that clearly and provide the preview URL.
6. Report the lint/build results, preview URL, and whether Chrome opened successfully. Leave the preview process running.

Run commands from the `frontend` directory (or use the equivalent `--prefix frontend`). Do not read, print, or expose local `.env` files or their values; Vite loads its environment configuration automatically.
