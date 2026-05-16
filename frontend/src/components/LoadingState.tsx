export function LoadingState({ label = "Loading workspace..." }: { label?: string }) {
  return (
    <div className="state-card">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  );
}
