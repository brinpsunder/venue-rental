export default function RemoteFallback({ name }) {
  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        color: '#6e6e73',
        fontSize: 14,
      }}
    >
      Loading <strong>{name}</strong> micro-frontend…
    </div>
  );
}
