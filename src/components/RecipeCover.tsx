import { ChefHat } from "lucide-react";

type RecipeCoverProps = {
  title: string;
  accentColor?: string | null;
  className?: string;
};

export function RecipeCover({ title, accentColor = "#375f4a", className = "" }: RecipeCoverProps) {
  return (
    <div className={`relative h-full min-h-44 overflow-hidden ${className}`} style={{ backgroundColor: accentColor || "#375f4a" }} aria-label={`Capa editorial de ${title}`}>
      <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/20" aria-hidden="true" />
      <div className="absolute -bottom-14 -left-8 h-40 w-40 rounded-full border border-white/20 bg-black/10" aria-hidden="true" />
      <div className="absolute bottom-4 right-5 h-16 w-16 rotate-12 rounded-[2rem] border border-white/25 bg-white/10" aria-hidden="true" />
      <div className="relative flex h-full flex-col justify-between p-5 text-white">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15 backdrop-blur-sm"><ChefHat size={20} /></span>
        <div className="max-w-[85%]">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/70">Receita do Universo</p>
          <p className="display-font mt-2 text-2xl font-semibold leading-[0.95] tracking-[-.03em]">{title}</p>
        </div>
      </div>
    </div>
  );
}
