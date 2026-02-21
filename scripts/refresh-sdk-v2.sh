#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SDK_DIR="${1:-${ROOT_DIR}/../typescript-sdk}"
OUT_DIR="${ROOT_DIR}/vendor/mcp-sdk-v2"

if [[ ! -d "${SDK_DIR}" ]]; then
  echo "SDK directory not found: ${SDK_DIR}" >&2
  echo "Pass the SDK path explicitly: npm run refresh:sdk-v2 -- /absolute/path/to/typescript-sdk" >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required but not installed." >&2
  exit 1
fi

COMMIT_HASH="$(git -C "${SDK_DIR}" rev-parse HEAD)"
PACK_DATE="$(date +%Y-%m-%d)"

mkdir -p "${OUT_DIR}"
rm -f "${OUT_DIR}"/modelcontextprotocol-*.tgz

echo "Refreshing MCP SDK v2 tarballs from ${SDK_DIR} (${COMMIT_HASH})"
pnpm -C "${SDK_DIR}" install
pnpm -C "${SDK_DIR}/packages/server" pack --pack-destination "${OUT_DIR}"
pnpm -C "${SDK_DIR}/packages/middleware/node" pack --pack-destination "${OUT_DIR}"
pnpm -C "${SDK_DIR}/packages/middleware/express" pack --pack-destination "${OUT_DIR}"

cat > "${OUT_DIR}/PINNED_SDK_COMMIT.txt" <<PIN
modelcontextprotocol/typescript-sdk main
commit: ${COMMIT_HASH}
packed-on: ${PACK_DATE}
notes: pre-release v2 tarballs generated locally with pnpm pack
PIN

echo "Done. Tarballs updated in ${OUT_DIR}"
