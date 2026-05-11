/**
 * Porazdeljeno sledenje (Distributed Tracing) — OpenTelemetry init.
 *
 * Uvozi se PRVO v server.ts, da auto-instrumentation prestreže module
 * (express, http, grpc, axios) PREDEN se uporabijo v aplikacijski kodi.
 *
 * Pošilja spans na OTLP HTTP collector (Jaeger).
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

const serviceName = process.env.OTEL_SERVICE_NAME ?? 'web-bff';
const endpoint =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://jaeger:4318/v1/traces';

const sdk = new NodeSDK({
  resource: new Resource({ [ATTR_SERVICE_NAME]: serviceName }),
  traceExporter: new OTLPTraceExporter({ url: endpoint }),
  instrumentations: [
    getNodeAutoInstrumentations({
      // Logi v fs niso zanimivi, samo šum.
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

try {
  sdk.start();
  console.log(`[tracing] OpenTelemetry started — service=${serviceName} endpoint=${endpoint}`);
} catch (err) {
  console.error('[tracing] failed to start OpenTelemetry SDK', err);
}

process.on('SIGTERM', () => {
  sdk.shutdown().catch(() => undefined);
});
