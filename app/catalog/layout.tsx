import CatalogNav from "@/components/catalog/CatalogNav";

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CatalogNav />
      {children}
    </>
  );
}
