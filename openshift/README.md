# Namestitev na OpenShift

Manifeste tukaj namesti tvoj `venue-rental` sistem na OpenShift cluster (Developer Sandbox ali kateri koli OpenShift 4.x).

## Predpogoji

1. **OpenShift dostop** — Red Hat Developer Sandbox ali drug cluster.
2. **`oc` CLI** — `brew install openshift-cli`.
3. **Docker Hub slike** — vsi mikroservisi morajo biti pushani kot
   `<DOCKERHUB_USERNAME>/venue-rental-<service>:latest`.
   (GitHub Actions v `.github/workflows/docker-*.yml` to že počnejo ob push-u na `main`.)

## Hitra namestitev

```bash
# 1. Prijavi se (skopiraj "Copy login command" iz OpenShift konzole)
oc login --token=sha256~XXX --server=https://api.rm1.0a51.p1.openshiftapps.com:6443

# 2. Preveri, da si v pravem namespace
oc project ai-modeler-dev

# 3. Deploy
export DOCKERHUB_USERNAME=brinpsunder   # zamenjaj s svojim
./openshift/deploy.sh
```

## Struktura

| Datoteka | Vsebina |
|---|---|
| `01-config.yaml` | `Secret` (gesla, JWT) + `ConfigMap` (LOG_LEVEL, DB imena, OTEL endpoint) |
| `10-databases.yaml` | 3× PostgreSQL (Deployment + PVC + Service) — `bitnami/postgresql:15` |
| `11-infra.yaml` | RabbitMQ, Jaeger |
| `20-services.yaml` | `user-service`, `venue-service`, `reservation-service` |
| `30-bffs.yaml` | `web-bff`, `mobile-bff` (2 replike vsak — pripravljeno za HPA) |
| `40-frontend.yaml` | `shell`, `venues-mfe`, `reservations-mfe` |
| `50-routes.yaml` | OpenShift `Route` — javni HTTPS URL-ji za `shell`, BFF-je in Jaeger |
| `60-hpa.yaml` | `HorizontalPodAutoscaler` na BFF-jih (skaliranje) |
| `70-network-policies.yaml` | `NetworkPolicy` — baze sprejemajo samo od svoje storitve |

## Pokritost zahtev iz navodil

| Zahteva | Kje |
|---|---|
| **Orkestracija kontejnerjev** | Deployment + Service za vsako storitev |
| **Mikrostoritvena arhitektura** | 3 ločeni servisi + 2 BFF + 3 frontend deli |
| **Skaliranje** | `60-hpa.yaml` — HPA na BFF-jih (2-5 replik pri 70% CPU) |
| **Omrežna pravila** | `70-network-policies.yaml` — baze nedostopne razen iz lastne storitve |
| **Varnost** | `Secret` za gesla in JWT, `ConfigMap` za ne-občutljive vrednosti |
| **Persistentni podatki** | `PersistentVolumeClaim` × 3 (po 1 GiB) |

## Verifikacija po deployu

```bash
oc get pods                  # vsi Running
oc get routes                # dobiš javne URL-je
oc get hpa                   # vidiš skaliranje
oc get networkpolicy         # vidiš omrežna pravila

# Javni URL-ji
oc get route shell -o jsonpath='{.spec.host}'       # spletni UI
oc get route web-bff -o jsonpath='{.spec.host}'     # web API
oc get route mobile-bff -o jsonpath='{.spec.host}'  # mobile API
oc get route jaeger -o jsonpath='{.spec.host}'      # tracing UI
```

## Demo profesorju

1. Odpri `shell` route URL v brskalniku — UI deluje.
2. Pošlji nekaj zahtev na BFF route z `curl` ali Postman — odzivi delujejo.
3. Odpri Jaeger route URL — vidiš distributed tracing v živo.
4. `oc get hpa` — pokaže avtomatsko skaliranje.
5. `oc describe networkpolicy user-db-from-user-service-only` — pokaže omrežno politiko.
6. `oc get secret app-secrets -o yaml` — pokaže, da so gesla v Secret-ih, ne v env varih.

## Trouble-shooting

**Pod v `CrashLoopBackOff`:**
```bash
oc logs deployment/<ime>
```

**Slika se ne potegne (`ImagePullBackOff`):**
- Preveri, da je `DOCKERHUB_USERNAME` pravilen.
- Preveri, da je slika javna na Docker Hubu (`docker pull docker.io/<user>/venue-rental-user-service:latest`).

**Baza ne starta:**
- `bitnami/postgresql` zahteva OpenShift-kompatibilen SCC. Če ne dela, lahko probaš `image: docker.io/bitnami/postgresql:15` v `10-databases.yaml`.

**HPA pravi `<unknown>` namesto CPU%:**
- `metrics-server` mora delovati. Na Sandbox-u običajno že je.
- Vsi podi morajo imeti `resources.requests.cpu` — kar že imamo.
