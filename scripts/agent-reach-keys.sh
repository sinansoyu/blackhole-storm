#!/bin/bash
# Agent Reach key/cookie ayarı — her oturum başında SessionStart hook'u çalıştırır.
# Değerleri ortamın environment variables alanından okur; tanımlı olmayanları atlar.
# Değerler asla komut satırı argümanı olarak geçirilmez (stdin kullanılır).
#
#   EXA_API_KEY          Exa web araması
#   GROQ_API_KEY         Xiaoyuzhou podcast transkripsiyonu
#   TWITTER_AUTH_TOKEN   Twitter/X (TWITTER_CT0 ile birlikte)
#   TWITTER_CT0
#   REDDIT_COOKIE        Reddit, Cookie-Editor "Header String" çıktısı
#   XUEQIU_COOKIE        Xueqiu, Cookie-Editor "Header String" çıktısı
#
# Xiaohongshu burada yok: xiaohongshu-mcp Docker container'ı gerektiriyor.

[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
command -v agent-reach >/dev/null 2>&1 || exit 0

log() { echo "[agent-reach-keys] $*" >&2; }
configured=()

if [ -n "$EXA_API_KEY" ] && command -v mcporter >/dev/null 2>&1; then
  mcporter config remove exa --scope home >/dev/null 2>&1
  if mcporter config add exa "https://mcp.exa.ai/mcp?exaApiKey=${EXA_API_KEY}" --scope home >/dev/null 2>&1; then
    configured+=(exa)
  else
    log "Exa ayarlanamadı"
  fi
fi

if [ -n "$GROQ_API_KEY" ]; then
  printf '%s' "$GROQ_API_KEY" | agent-reach configure groq-key --stdin >/dev/null 2>&1 \
    && configured+=(groq) || log "Groq key ayarlanamadı"
fi

if [ -n "$TWITTER_AUTH_TOKEN" ] && [ -n "$TWITTER_CT0" ]; then
  printf 'auth_token=%s; ct0=%s' "$TWITTER_AUTH_TOKEN" "$TWITTER_CT0" \
    | agent-reach configure twitter-cookies --stdin >/dev/null 2>&1 \
    && configured+=(twitter) || log "Twitter cookie'leri ayarlanamadı"
fi

# Xueqiu ve Reddit için agent-reach'te stdin'li configure komutu yok; dosyaya doğrudan yazılır.
AR_PY="$(head -1 "$(command -v agent-reach)" | sed 's/^#!//')"

if [ -n "$XUEQIU_COOKIE" ]; then
  "$AR_PY" - <<'EOF' && configured+=(xueqiu) || log "Xueqiu cookie'si ayarlanamadı"
import os
from agent_reach.config import Config
Config().set("xueqiu_cookie", os.environ["XUEQIU_COOKIE"].strip())
EOF
fi

if [ -n "$REDDIT_COOKIE" ]; then
  python3 - <<'EOF' && configured+=(reddit) || log "Reddit cookie'si ayarlanamadı"
import json, os, time
from pathlib import Path
cookies = {}
for part in os.environ["REDDIT_COOKIE"].split(";"):
    name, sep, value = part.strip().partition("=")
    if sep and name:
        cookies[name] = value
if "reddit_session" not in cookies:
    raise SystemExit("reddit_session cookie missing")
path = Path.home() / ".config" / "rdt-cli" / "credential.json"
path.parent.mkdir(parents=True, exist_ok=True)
fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
with os.fdopen(fd, "w") as f:
    json.dump({"cookies": cookies, "source": "env", "saved_at": time.time()}, f)
EOF
fi

[ ${#configured[@]} -gt 0 ] && log "ayarlandı: ${configured[*]}"
exit 0
