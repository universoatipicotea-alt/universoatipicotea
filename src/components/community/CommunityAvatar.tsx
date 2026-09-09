import { initials } from "./community-utils";

type CommunityAvatarProps = {
  name?: string | null;
  image?: string | null;
  size?: "sm" | "md";
};

export function CommunityAvatar({ name, image, size = "md" }: CommunityAvatarProps) {
  const sizeClass = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  return image ? (
    <img
      src={image}
      alt=""
      loading="lazy"
      decoding="async"
      className={`${sizeClass} shrink-0 rounded-full object-cover`}
    />
  ) : (
    <span
      aria-hidden="true"
      className={`grid ${sizeClass} shrink-0 place-items-center rounded-full bg-[var(--sage-pale)] text-xs font-extrabold text-[var(--sage-deep)]`}
    >
      {initials(name)}
    </span>
  );
}
