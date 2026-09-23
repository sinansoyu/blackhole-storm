#!/bin/bash
# Agent Reach kurulumu (Claude Code bulut ortamı setup script'i)
# Her adım bağımsız: biri başarısız olsa da oturum açılmaya devam eder.

log() { echo "[agent-reach-setup] $*"; }

# 1) Sistem paketleri: gh CLI ve ffmpeg (podcast transkripsiyonu için)
apt-get update -qq >/dev/null 2>&1 || log "apt-get update başarısız"
apt-get install -y -qq --no-install-recommends gh ffmpeg >/dev/null 2>&1 \
  || log "gh/ffmpeg kurulamadı"

# 2) Node araçları: mcporter (Exa arama ve LinkedIn MCP için)
npm install -g mcporter >/dev/null 2>&1 || log "mcporter kurulamadı"

# 3) uv/uvx (LinkedIn MCP sunucusunu çalıştırmak için)
pip install -q uv >/dev/null 2>&1 || log "uv kurulamadı"
export PATH="$HOME/.local/bin:$PATH"

# 4) Agent Reach: zip indirme engelli olabildiği için git clone ile kur
SRC="$HOME/.agent-reach/src"
rm -rf "$SRC"
if git clone -q --depth 1 https://github.com/Panniantong/agent-reach.git "$SRC"; then
  pip install -q "$SRC" >/dev/null 2>&1 || log "agent-reach pip kurulumu başarısız"
else
  log "agent-reach klonlanamadı"
fi

# 5) Kanallar ve yapılandırma
if command -v agent-reach >/dev/null 2>&1; then
  agent-reach install --env=auto --system --channels=all >/dev/null 2>&1 \
    || log "agent-reach install bazı adımlarda başarısız (cookie/key gerektiren kanallar için normal)"
fi

mkdir -p "$HOME/.config/yt-dlp"
grep -qxF -- '--js-runtimes node' "$HOME/.config/yt-dlp/config" 2>/dev/null \
  || echo '--js-runtimes node' >> "$HOME/.config/yt-dlp/config"

if command -v mcporter >/dev/null 2>&1; then
  mcporter config add exa https://mcp.exa.ai/mcp --scope home >/dev/null 2>&1 || true
  mcporter config add linkedin --command uvx --arg mcp-server-linkedin@latest \
    --env UV_HTTP_TIMEOUT=300 --scope home >/dev/null 2>&1 || true
fi

log "tamamlandı"
exit 0
