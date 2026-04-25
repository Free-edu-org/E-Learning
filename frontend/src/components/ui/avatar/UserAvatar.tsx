import { Avatar, type AvatarProps } from "@mui/material";

interface UserAvatarProps extends Omit<AvatarProps, "src" | "children"> {
  avatarUrl?: string | null;
  username?: string | null;
  size?: number;
}

export function UserAvatar({
  avatarUrl,
  username,
  size = 40,
  sx,
  ...props
}: UserAvatarProps) {
  const isPreset = !!avatarUrl?.startsWith("preset:");
  const presetName = isPreset && avatarUrl ? avatarUrl.substring(7) : null;
  const resolvedSrc = isPreset
    ? `/avatars/${presetName}.svg`
    : avatarUrl
      ? `http://localhost:8080${avatarUrl}`
      : undefined;

  const initials = username ? username.substring(0, 2).toUpperCase() : "?";

  return (
    <Avatar
      src={resolvedSrc || undefined}
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        ...sx,
      }}
      {...props}
    >
      {!resolvedSrc && initials}
    </Avatar>
  );
}
