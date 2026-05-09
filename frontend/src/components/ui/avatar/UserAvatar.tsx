import { Avatar, type AvatarProps } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

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
  const theme = useTheme();
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
        position: "relative",
        border: "1px solid",
        borderColor: resolvedSrc
          ? theme.palette.mode === "light"
            ? alpha(theme.palette.common.white, 0.88)
            : alpha(theme.palette.common.white, 0.14)
          : theme.palette.mode === "light"
            ? alpha(theme.palette.primary.main, 0.14)
            : alpha(theme.palette.primary.light, 0.18),
        bgcolor: resolvedSrc
          ? undefined
          : theme.palette.mode === "light"
            ? alpha(theme.palette.primary.main, 0.12)
            : alpha(theme.palette.primary.light, 0.18),
        color: resolvedSrc
          ? undefined
          : theme.palette.mode === "light"
            ? theme.palette.primary.dark
            : theme.palette.common.white,
        backgroundImage: resolvedSrc
          ? undefined
          : theme.palette.mode === "light"
            ? "linear-gradient(135deg, rgba(99,102,241,0.22) 0%, rgba(59,130,246,0.16) 100%)"
            : "linear-gradient(135deg, rgba(129,140,248,0.28) 0%, rgba(59,130,246,0.18) 100%)",
        boxShadow: resolvedSrc
          ? theme.palette.mode === "light"
            ? "0 8px 18px rgba(15, 23, 42, 0.06)"
            : "0 10px 18px rgba(2, 6, 23, 0.18)"
          : theme.palette.mode === "light"
            ? "0 8px 18px rgba(59, 130, 246, 0.1)"
            : "0 10px 18px rgba(59, 130, 246, 0.1)",
        fontWeight: 700,
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 1,
          borderRadius: "inherit",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0) 42%)",
          pointerEvents: "none",
        },
        ...sx,
      }}
      {...props}
    >
      {!resolvedSrc && initials}
    </Avatar>
  );
}
