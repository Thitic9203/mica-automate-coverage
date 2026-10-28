# Spec — Qase proxy reads its token from a secret

Status: owner order 2026-10-28 ("สภาพ แก้ไขมาด่วน") after the audit found the Qase API token hardcoded in
`functions/api/qase/[[path]].js` of this **public** repo.

- **R1** — The proxy MUST read the Qase token from the Pages secret `QASE_API_TOKEN` (`context.env`), and the
  repo MUST NOT contain any Qase token.
- **R2** — When the secret is missing the proxy MUST answer HTTP 500 with a JSON error that names the missing
  setting and MUST NOT call Qase.
- **R3** — Path, query, method and the response headers stay as they are today (callers unchanged).
- **R4** — The token that was committed is compromised (it stays in git history): the owner revokes it in
  Qase after the secret-based proxy is live. Not done by the agent.

Done when: `grep` finds no 64-hex token in `functions/`; proxy tests pass; production `/api/qase/project/MA`
answers 200 using the secret.
