export default function ObsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`html, body { background: transparent !important; }`}</style>
      <div className="min-h-screen bg-transparent">{children}</div>
    </>
  );
}
