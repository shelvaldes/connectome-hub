#!/usr/bin/env bash
# Connectome Hub bootstrap: installs Bun when missing, installs dependencies,
# and launches the setup wizard.
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

BUN_INSTALL_DIR="${BUN_INSTALL:-$HOME/.bun}"
BUN_MIN_MAJOR=1
BUN_MIN_MINOR=4
BUN_MIN_PATCH=3
NO_LAUNCH=0

usage() {
  cat <<'EOF'
Usage: ./install.sh [--no-launch]

Installs Bun (if missing), installs Connectome Hub dependencies, and starts
the interactive setup wizard.

  --no-launch   Install everything but do not start the wizard.
  -h, --help    Show this help.
EOF
}

say() { printf '\n%s\n' "$*"; }
die() { printf '\nError: %s\n' "$*" >&2; exit 1; }

for arg in "$@"; do
  case "$arg" in
    --no-launch) NO_LAUNCH=1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Opción desconocida: $arg" >&2; usage >&2; exit 1 ;;
  esac
done

[ -f package.json ] && [ -d packages/cli ] || die "Corre este script desde la raíz de connectome-hub."

case "$(uname -s)" in
  Linux|Darwin) ;;
  *) die "Connectome Hub soporta Linux y macOS. En Windows, usa WSL." ;;
esac

for cmd in curl; do
  command -v "$cmd" >/dev/null 2>&1 || die "Falta '$cmd'. Instálalo y vuelve a correr ./install.sh."
done

if ! command -v unzip >/dev/null 2>&1; then
  die "Falta 'unzip'. En Fedora: sudo dnf install unzip. En Debian/Ubuntu: sudo apt-get install unzip."
fi

find_bun() {
  if command -v bun >/dev/null 2>&1; then
    command -v bun
  elif [ -x "$BUN_INSTALL_DIR/bin/bun" ]; then
    printf '%s\n' "$BUN_INSTALL_DIR/bin/bun"
  fi
}

BUN_BIN="$(find_bun || true)"
if [ -z "$BUN_BIN" ]; then
  say "Bun no está instalado. Instalando Bun en $BUN_INSTALL_DIR..."
  if ! curl -fsSL https://bun.sh/install | BUN_INSTALL="$BUN_INSTALL_DIR" bash; then
    die "No se pudo instalar Bun. Revisa tu conexión e inténtalo de nuevo."
  fi
  BUN_BIN="$BUN_INSTALL_DIR/bin/bun"
fi

[ -x "$BUN_BIN" ] || die "No se encontró el binario de Bun en $BUN_BIN."

export BUN_INSTALL="$BUN_INSTALL_DIR"
export PATH="$BUN_INSTALL/bin:$PATH"

BUN_VERSION="$("$BUN_BIN" --version)"
if ! "$BUN_BIN" -e "const v=process.versions.bun.split('.').map(Number); process.exit(v[0]>$BUN_MIN_MAJOR||(v[0]===$BUN_MIN_MAJOR&&(v[1]>$BUN_MIN_MINOR||(v[1]===$BUN_MIN_MINOR&&v[2]>=$BUN_MIN_PATCH)))?0:1)"; then
  die "Se requiere Bun >= $BUN_MIN_MAJOR.$BUN_MIN_MINOR.$BUN_MIN_PATCH; tienes $BUN_VERSION. Actualiza con: bun upgrade"
fi

say "Bun $BUN_VERSION listo."
say "Instalando dependencias..."
"$BUN_BIN" install

say "Instalando los comandos chub y connectome-hub..."
if ! ( cd packages/cli && "$BUN_BIN" link ); then
  die "No se pudieron registrar los comandos."
fi
if [ ! -x "$BUN_INSTALL/bin/chub" ] || [ ! -x "$BUN_INSTALL/bin/connectome-hub" ]; then
  die "No se crearon los comandos en $BUN_INSTALL/bin."
fi
say "Comandos listos: chub (principal) y connectome-hub (alias)."

if [ "$NO_LAUNCH" -eq 1 ]; then
  say "Dependencias y comando instalados. No se lanzó el wizard (--no-launch)."
  exit 0
fi

say "Lanzando el wizard..."
exec "$BUN_BIN" start init
