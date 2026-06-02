# OpenShift Deployment

These manifests deploy the `venue-rental` system to an OpenShift cluster (Red Hat Developer Sandbox or any OpenShift 4.x).

> Slovenian version: [readme-slo.md](readme-slo.md)

## Prerequisites

1. **OpenShift access** — Red Hat Developer Sandbox or another cluster.
2. **`oc` CLI** — `brew install openshift-cli`
3. **Docker Hub images** — all microservices must be pushed as
   `<DOCKERHUB_USERNAME>/venue-rental-<service>:latest`.
   (GitHub Actions in `.github/workflows/docker-*.yml` do this automatically on push to `main`.)

## Quick Deploy

```bash
# 1. Log in (copy "Copy login command" from the OpenShift console)
oc login --token=sha256~XXX --server=https://api.rm1.0a51.p1.openshiftapps.com:6443

# 2. Confirm you are in the right namespace
oc project ai-modeler-dev

# 3. Deploy
export DOCKERHUB_USERNAME=brinpsunder   # replace with your username
./openshift/deploy.sh
```

## Manifest Overview

| File | Contents |
|---|---|
| `01-config.yaml` | `Secret` (passwords, JWT) + `ConfigMap` (LOG_LEVEL, DB names, OTEL endpoint) |
| `10-databases.yaml` | 3× PostgreSQL (Deployment + PVC + Service) — `bitnami/postgresql:15` |
| `11-infra.yaml` | RabbitMQ, Jaeger |
| `20-services.yaml` | `user-service`, `venue-service`, `reservation-service` |
| `30-bffs.yaml` | `web-bff`, `mobile-bff` (2 replicas each — ready for HPA) |
| `40-frontend.yaml` | `shell`, `venues-mfe`, `reservations-mfe` |
| `50-routes.yaml` | OpenShift `Route` — public HTTPS URLs for `shell`, BFFs, and Jaeger |
| `60-hpa.yaml` | `HorizontalPodAutoscaler` on the BFFs (auto-scaling) |
| `70-network-policies.yaml` | `NetworkPolicy` — databases accept traffic only from their own service |

## Requirements Coverage

| Requirement | Where |
|---|---|
| **Container orchestration** | Deployment + Service for every microservice |
| **Microservice architecture** | 3 backend services + 2 BFFs + 3 frontend modules |
| **Auto-scaling** | `60-hpa.yaml` — HPA on BFFs (2–5 replicas at 70% CPU) |
| **Network policies** | `70-network-policies.yaml` — databases unreachable except from their own service |
| **Security** | `Secret` for passwords and JWT; `ConfigMap` for non-sensitive values |
| **Persistent storage** | `PersistentVolumeClaim` × 3 (1 GiB each) |

## Verification After Deploy

```bash
oc get pods                  # all Running
oc get routes                # get public URLs
oc get hpa                   # see auto-scaling
oc get networkpolicy         # see network policies

# Public URLs
oc get route shell -o jsonpath='{.spec.host}'       # web UI
oc get route web-bff -o jsonpath='{.spec.host}'     # web API
oc get route mobile-bff -o jsonpath='{.spec.host}'  # mobile API
oc get route jaeger -o jsonpath='{.spec.host}'      # tracing UI
```

## Demo Walkthrough

1. Open the `shell` route URL in a browser — the UI is live.
2. Send a few requests to the BFF route with `curl` or Postman — responses work.
3. Open the Jaeger route URL — live distributed tracing is visible.
4. `oc get hpa` — shows auto-scaling configuration.
5. `oc describe networkpolicy user-db-from-user-service-only` — shows the network policy in effect.
6. `oc get secret app-secrets -o yaml` — shows credentials stored in Secrets, not env vars.

## Troubleshooting

**Pod in `CrashLoopBackOff`:**
```bash
oc logs deployment/<name>
```

**Image not pulling (`ImagePullBackOff`):**
- Verify `DOCKERHUB_USERNAME` is correct.
- Confirm the image is public on Docker Hub: `docker pull docker.io/<user>/venue-rental-user-service:latest`

**Database won't start:**
- `bitnami/postgresql` requires an OpenShift-compatible SCC. If it fails, try `image: docker.io/bitnami/postgresql:15` in `10-databases.yaml`.

**HPA shows `<unknown>` instead of CPU%:**
- `metrics-server` must be running. It is usually pre-installed on the Sandbox.
- All pods must have `resources.requests.cpu` set — which they do.
