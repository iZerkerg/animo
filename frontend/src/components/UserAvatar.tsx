import type { User } from "../services/api";

type Props = {
  user: Pick<User, "name" | "profileImageUrl">;
  size?: "sm" | "lg";
};

export function UserAvatar({ size = "sm", user }: Props) {
  const initial = user.name.trim().charAt(0).toUpperCase() || "A";

  if (user.profileImageUrl) {
    return <img alt="Foto de perfil" className={`user-avatar ${size}`} src={user.profileImageUrl} />;
  }

  return (
    <span aria-label={`Avatar de ${user.name}`} className={`user-avatar default ${size}`} role="img">
      {initial}
    </span>
  );
}
