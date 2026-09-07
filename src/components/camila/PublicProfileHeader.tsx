type PublicProfileHeaderProps = {
  handle: string;
  description: string;
  supportText: string;
};

export function PublicProfileHeader({
  handle,
  description,
  supportText,
}: PublicProfileHeaderProps) {
  return (
    <header className="text-center">
      <span className="mx-auto inline-flex rounded-full border border-[#d9e3ef] bg-white/80 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#31577f]">
        Conhecimento · inclusão · possibilidades
      </span>
      <p className="mt-6 text-xl font-extrabold tracking-[-0.025em] text-[#082c62] sm:text-2xl">
        {handle}
      </p>
      <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-[#405979] sm:text-base">
        {description}
      </p>
      <p className="display-font mx-auto mt-5 max-w-lg text-2xl font-semibold leading-tight text-[#082c62] sm:text-3xl">
        {supportText}
      </p>
    </header>
  );
}
