export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-page" data-admin>
      {/* Hide root layout site chrome on admin pages */}
      <style>{`
        [data-admin] ~ *,
        body > a.skip-to-content { display: none !important; }
        body > header,
        body > footer { display: none !important; }
        body > main { padding: 0 !important; margin: 0 !important; }
      `}</style>
      {children}
    </div>
  );
}
