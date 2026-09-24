// The slow-moving colour behind every signed-in page: three soft washes of the
// brand and chart colours that drift. Decoration only, so it is hidden from
// screen readers, never takes a click, sits behind the content, and stands
// still for anyone who has asked for reduced motion.
export default function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <span className="wash wash-1" />
      <span className="wash wash-2" />
      <span className="wash wash-3" />
    </div>
  );
}
