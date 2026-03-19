export default function HeroIllustration({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-primary-light to-primary-200">
        {/* Replace with actual Commerce PL photo later */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80"
          alt="Warm, inviting library interior with bookshelves and natural light"
          className="object-cover w-full h-full"
          loading="eager"
        />
      </div>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-primary-dark/20 via-transparent to-transparent" />
    </div>
  );
}
