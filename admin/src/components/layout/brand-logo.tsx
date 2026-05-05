import Image from "next/image";
import { cn } from "@/lib/utils";
import sirkulaLogo from "../../../assets/img/Sirkula.png";

interface BrandLogoProps {
  className?: string;
  textClassName?: string;
  imageClassName?: string;
  showSubtitle?: boolean;
  subtitleClassName?: string;
}

export function BrandLogo({
  className,
  textClassName,
  imageClassName,
  showSubtitle = true,
  subtitleClassName,
}: BrandLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src={sirkulaLogo}
        alt="Logo Sirkula"
        priority
        className={cn("h-20 w-20 rounded-xl object-contain", imageClassName)}
      />
      <div>
        <span className={cn("text-xl font-semibold text-green-700 tracking-tight", textClassName)}>
          Sirkula
        </span>
      </div>
    </div>
  );
}