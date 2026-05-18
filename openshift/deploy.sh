#!/usr/bin/env bash
set -euo pipefail

# Deploy venue-rental to OpenShift.
# Usage:
#   DOCKERHUB_USERNAME=brinpsunder ./openshift/deploy.sh
#
# Predpogoji:
#   - oc CLI nameščen in prijavljen (`oc login --token=... --server=...`)
#   - Slike pushane v Docker Hub kot $DOCKERHUB_USERNAME/venue-rental-<service>:latest

: "${DOCKERHUB_USERNAME:?Set DOCKERHUB_USERNAME (e.g. export DOCKERHUB_USERNAME=brinpsunder)}"

cd "$(dirname "$0")"

echo "==> Trenutni namespace: $(oc project -q)"
echo "==> Docker Hub user:    $DOCKERHUB_USERNAME"
echo

apply() {
  local file=$1
  echo "==> oc apply -f $file"
  sed "s|DOCKERHUB_USERNAME|$DOCKERHUB_USERNAME|g" "$file" | oc apply -f -
}

apply 01-config.yaml
apply 10-databases.yaml
apply 11-infra.yaml

echo "==> Čakam, da postanejo baze pripravljene (do 90s)..."
oc wait --for=condition=Available --timeout=90s \
  deployment/user-db deployment/venue-db deployment/reservation-db || true

apply 20-services.yaml
apply 30-bffs.yaml
apply 40-frontend.yaml
apply 50-routes.yaml
apply 60-hpa.yaml
apply 70-network-policies.yaml

echo
echo "==> Hostname-i (Routes):"
oc get routes -o custom-columns=NAME:.metadata.name,URL:.spec.host

echo
echo "==> Status:"
oc get pods
