import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "white";
}

export default function Logo({
  className = "",
  size = "md",
  variant = "default",
}: LogoProps) {
  const sizes = {
    sm: { width: 120, height: 40 },
    md: { width: 160, height: 53 },
    lg: { width: 200, height: 67 },
  };

  const s = sizes[size];
  const src = variant === "white" ? "/images/logo-white.png" : "/images/logo-original.png";

  return (
    <Image
      src={src}
      alt="Commerce Public Library"
      width={s.width}
      height={s.height}
      className={`object-contain ${className}`}
      priority
    />
  );
}
