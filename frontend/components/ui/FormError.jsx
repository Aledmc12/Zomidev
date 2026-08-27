export default function FormError({ id, message }) {
  if (!message) return null
  return (
    <p id={id} role="alert" aria-live="polite" className="text-sm text-red-300">
      {message}
    </p>
  )
}
