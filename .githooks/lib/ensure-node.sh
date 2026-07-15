# ensure-node.sh — SOURCE this (`. "$(dirname "$0")/lib/ensure-node.sh"`).
# GUI git clients (VS Code, JetBrains, Fork, GitHub Desktop, ...) launch hooks
# with a minimal PATH that omits the shims added by nvm/fnm/volta/asdf, so
# `npm` is often missing even though it works in a normal terminal. Try the
# common version managers so hooks behave the same from GUI and CLI.
if ! command -v npm >/dev/null 2>&1; then
  # fnm
  if command -v fnm >/dev/null 2>&1; then
    eval "$(fnm env 2>/dev/null)" 2>/dev/null || true
  fi

  # nvm — add a node bin dir to PATH without paying the cost of sourcing nvm.sh.
  if ! command -v npm >/dev/null 2>&1; then
    _nvm_root="${NVM_DIR:-$HOME/.nvm}/versions/node"
    if [ -d "$_nvm_root" ]; then
      _newest="$(ls -1 "$_nvm_root" 2>/dev/null | sort -V | tail -1)"
      [ -n "$_newest" ] && [ -d "$_nvm_root/$_newest/bin" ] && \
        PATH="$_nvm_root/$_newest/bin:$PATH" && export PATH
    fi
    unset _nvm_root _newest
  fi

  # volta
  if ! command -v npm >/dev/null 2>&1 && [ -d "${VOLTA_HOME:-$HOME/.volta}/bin" ]; then
    PATH="${VOLTA_HOME:-$HOME/.volta}/bin:$PATH" && export PATH
  fi

  # asdf
  if ! command -v npm >/dev/null 2>&1 && [ -f "${ASDF_DIR:-$HOME/.asdf}/asdf.sh" ]; then
    . "${ASDF_DIR:-$HOME/.asdf}/asdf.sh" 2>/dev/null || true
  fi
fi
