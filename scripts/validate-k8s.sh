#!/usr/bin/env bash
# Valide en local tous les overlays Kustomize (fusion base + overlay).
# Sort en erreur (code != 0) si un build échoue -> à brancher sur un hook git
# pour ne jamais pousser des manifests cassés en CI.
set -uo pipefail

# kustomize intégré à kubectl ; fallback sur le binaire autonome s'il existe.
build() {
  if command -v kustomize >/dev/null 2>&1; then
    kustomize build "$1"
  else
    kubectl kustomize "$1"
  fi
}

root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$root"

# Pas de 'mapfile' (absent du bash 3.2 livré avec macOS) : on lit la liste ligne à ligne.
overlays="$(find k8s/overlays -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort)"
if [ -z "$overlays" ]; then
  echo "ℹ️  Aucun overlay sous k8s/overlays/* — rien à valider."
  exit 0
fi

fail=0
while IFS= read -r o; do
  [ -z "$o" ] && continue
  if out=$(build "$o" 2>&1); then
    echo "✅ $o"
  else
    echo "❌ $o"
    printf '%s\n' "$out" | sed 's/^/     /'
    fail=1
  fi
done <<EOF
$overlays
EOF

if [[ $fail -eq 0 ]]; then
  echo "✔ kustomize : tous les overlays sont valides."
else
  echo "✖ kustomize : validation en échec (voir ci-dessus)." >&2
  exit 1
fi
