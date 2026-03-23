import amqplib from 'amqplib';

const EXCHANGE = 'reservations';
const QUEUE = 'reservation-events';
const ROUTING_KEYS = ['reservation.created', 'reservation.confirmed', 'reservation.cancelled'];

export async function startConsumer(): Promise<void> {
  const url = process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';
  const connection = await amqplib.connect(url);
  const channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE, 'direct', { durable: true });
  await channel.assertQueue(QUEUE, { durable: true });

  for (const key of ROUTING_KEYS) {
    await channel.bindQueue(QUEUE, EXCHANGE, key);
  }

  console.log(`[Consumer] Listening on queue "${QUEUE}"`);

  channel.consume(QUEUE, (msg) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString());
      console.log(`[Consumer] Received event: ${payload.event}`, payload.data);
    } catch (err) {
      console.error('[Consumer] Failed to parse message', err);
    }
    channel.ack(msg);
  });
}
