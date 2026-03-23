import amqplib from 'amqplib';

const EXCHANGE = 'reservations';

let channel: amqplib.Channel;

export async function connectPublisher(): Promise<void> {
  const url = process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';
  const conn = await amqplib.connect(url);
  channel = await conn.createChannel();
  await channel.assertExchange(EXCHANGE, 'direct', { durable: true });
}

export async function publishEvent(event: string, data: object): Promise<void> {
  if (!channel) {
    throw new Error('Publisher not connected');
  }
  const message = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
  channel.publish(EXCHANGE, event, Buffer.from(message), { persistent: true });
}
