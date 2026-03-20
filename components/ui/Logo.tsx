import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function Logo({
  className = "",
  size = "md",
}: LogoProps) {
  const sizes = {
    sm: { width: 120, height: 40 },
    md: { width: 160, height: 53 },
    lg: { width: 200, height: 67 },
  };

  const s = sizes[size];

  return (
    <Image
      src="/images/logo-original.png"
      alt="Commerce Public Library"
      width={s.width}
      height={s.height}
      className={`object-contain ${className}`}
      priority
    />
  );
}
