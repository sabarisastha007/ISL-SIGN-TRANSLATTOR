export default function VoiceButton({ icon, label, onClick, active = false, disabled = false, variant = 'secondary' }) {
  return (
    <button type="button" className={`btn ${variant} ${active ? 'is-active' : ''}`} onClick={onClick} disabled={disabled} aria-pressed={active || undefined}>
      <span aria-hidden="true">{icon}</span> {label}
    </button>
  );
}
