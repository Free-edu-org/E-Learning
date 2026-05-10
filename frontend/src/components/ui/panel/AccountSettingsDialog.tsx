import { useEffect, useState, useRef, useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  Snackbar,
  Stack,
  TextField,
  Collapse,
  Typography,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import {
  SettingsOutlined as SettingsIcon,
  CheckOutlined as CheckIcon,
  CloseOutlined as CloseIcon,
  CloudUploadOutlined as UploadIcon,
  ExpandMore as ExpandMoreIcon,
  VisibilityOutlined as VisibilityIcon,
  VisibilityOffOutlined as VisibilityOffIcon,
} from "@mui/icons-material";
import { alpha, useTheme } from "@mui/material/styles";
import { userService, type UserProfile } from "@/api/userService";
import { requestAchievementNotificationsRefresh } from "@/components/achievements/achievementNotificationEvents";
import {
  AppDialog,
  AppDialogHeader,
  AppDialogBody,
  AppDialogFooter,
  AppDialogStatus,
} from "@/components/ui/dialog/AppDialog";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/utils/dashboardUtils";
import { UserAvatar } from "@/components/ui/avatar/UserAvatar";
import { FormSection } from "@/components/ui/form/FormLayout";
import { INPUT_LIMITS } from "@/utils/inputLimits";

type FeedbackState = {
  severity: "success" | "error";
  message: string;
};

interface AccountSettingsDialogProps {
  open: boolean;
  user: UserProfile | null;
  onClose: () => void;
  onUserUpdated: (user: UserProfile) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AccountSettingsDialog({
  open,
  user,
  onClose,
  onUserUpdated,
}: AccountSettingsDialogProps) {
  const theme = useTheme();
  const { logout } = useAuth();

  // Profile state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  // Password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordExpanded, setPasswordExpanded] = useState(false);

  // UI state
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [presetsExpanded, setPresetsExpanded] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [avatarSnackbar, setAvatarSnackbar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const presets = useMemo(
    () => Array.from({ length: 12 }, (_, i) => `avatar_${i + 1}`),
    [],
  );

  useEffect(() => {
    if (!open) {
      setIsEditingUsername(false);
      setIsEditingEmail(false);
      setPasswordExpanded(false);
      setFieldErrors({});
      return;
    }

    setUsername(user?.username ?? "");
    setEmail(user?.email ?? "");
    setConfirmEmail("");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setFeedback(null);
    setFieldErrors({});
  }, [open, user]);

  const closeDialog = () => {
    if (profileLoading || passwordLoading || avatarLoading) return;
    onClose();
  };

  const resetFeedback = () => {
    setFeedback(null);
    setFieldErrors({});
  };

  const validateProfile = () => {
    const errors: Record<string, string> = {};
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (isEditingUsername) {
      if (!trimmedUsername) {
        errors.username = "Nazwa użytkownika nie może być pusta.";
      } else if (trimmedUsername.length > INPUT_LIMITS.username) {
        errors.username = `Maksymalna długość to ${INPUT_LIMITS.username} znaków.`;
      }
    }

    if (isEditingEmail) {
      if (!trimmedEmail) {
        errors.email = "Adres e-mail nie może być pusty.";
      } else if (!EMAIL_REGEX.test(trimmedEmail)) {
        errors.email = "Niepoprawny format adresu e-mail.";
      } else if (trimmedEmail.length > INPUT_LIMITS.email) {
        errors.email = `Maksymalna długość to ${INPUT_LIMITS.email} znaków.`;
      }

      if (trimmedEmail !== confirmEmail.trim()) {
        errors.confirmEmail = "Adresy email nie są identyczne.";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!user || profileLoading) return;
    if (!validateProfile()) return;

    setFeedback(null);
    setProfileLoading(true);
    try {
      const updatedUser = await userService.updateUser(user.publicId, {
        username: isEditingUsername ? username.trim() : user.username,
        email: isEditingEmail ? email.trim() : user.email,
      });
      onUserUpdated(updatedUser);
      setIsEditingUsername(false);
      setIsEditingEmail(false);
      setConfirmEmail("");
      setFeedback({
        severity: "success",
        message: "Profil został zaktualizowany.",
      });
    } catch (error) {
      const msg = getErrorMessage(error, "Błąd podczas aktualizacji profilu.");
      if (msg.toLowerCase().includes("email")) {
        setFieldErrors({ email: "Ten adres email jest już zajęty." });
      } else if (
        msg.toLowerCase().includes("użytkownik") ||
        msg.toLowerCase().includes("username")
      ) {
        setFieldErrors({ username: "Ta nazwa użytkownika jest już zajęta." });
      } else {
        setFeedback({ severity: "error", message: msg });
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const validatePassword = () => {
    const errors: Record<string, string> = {};
    if (!oldPassword) errors.oldPassword = "Podaj obecne hasło.";
    if (!newPassword) errors.newPassword = "Podaj nowe hasło.";
    if (newPassword.length < 8)
      errors.newPassword = "Hasło musi mieć min. 8 znaków.";
    if (newPassword !== confirmPassword)
      errors.confirmPassword = "Hasła nie są identyczne.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSavePassword = async () => {
    if (!user || passwordLoading) return;
    if (!validatePassword()) return;

    setFeedback(null);
    setPasswordLoading(true);
    try {
      await userService.changePassword(user.publicId, {
        oldPassword,
        newPassword,
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordExpanded(false);
      setFeedback({
        severity: "success",
        message: "Hasło zostało zmienione pomyślnie. Nastąpi wylogowanie.",
      });
      setTimeout(() => logout(), 1200);
    } catch (error) {
      const msg = getErrorMessage(error, "Błąd podczas zmiany hasła.");
      if (
        msg.toLowerCase().includes("obecne") ||
        msg.toLowerCase().includes("current")
      ) {
        setFieldErrors({ oldPassword: "Błędne obecne hasło." });
      } else {
        setFeedback({ severity: "error", message: msg });
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      setFeedback({
        severity: "error",
        message: "Maksymalny rozmiar pliku to 2MB.",
      });
      return;
    }

    setFeedback(null);
    setAvatarLoading(true);
    try {
      const updatedUser = await userService.uploadAvatar(user.publicId, file);
      onUserUpdated(updatedUser);
      requestAchievementNotificationsRefresh();
      setAvatarSnackbar(true);
    } catch {
      setFeedback({
        severity: "error",
        message: "Nie udało się wgrać zdjęcia.",
      });
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePresetSelect = async (presetName: string) => {
    if (!user || avatarLoading) return;
    setFeedback(null);
    setAvatarLoading(true);
    try {
      const updatedUser = await userService.setPresetAvatar(
        user.publicId,
        presetName,
      );
      onUserUpdated(updatedUser);
      requestAchievementNotificationsRefresh();
      setAvatarSnackbar(true);
    } catch {
      setFeedback({
        severity: "error",
        message: "Błąd podczas zmiany awatara.",
      });
    } finally {
      setAvatarLoading(false);
    }
  };

  const passwordStrength = useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score += 25;
    if (newPassword.length > 10) score += 25;
    if (/[A-Z]/.test(newPassword)) score += 25;
    if (/[0-9]/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword))
      score += 25;
    return score;
  }, [newPassword]);

  const strengthColor = () => {
    if (passwordStrength <= 25) return "#ef4444";
    if (passwordStrength <= 50) return "#f59e0b";
    if (passwordStrength <= 75) return "#3b82f6";
    return "#10b981";
  };

  const strengthLabel = () => {
    if (passwordStrength <= 25) return "Słabe";
    if (passwordStrength <= 50) return "Średnie";
    if (passwordStrength <= 75) return "Mocne";
    return "Bardzo mocne";
  };

  return (
    <>
      <AppDialog
        open={open}
        onClose={closeDialog}
        maxWidth="sm"
        paperSx={{
          width: { xs: "calc(100% - 28px)", sm: 580 },
        }}
      >
        <AppDialogHeader
          icon={<SettingsIcon sx={{ color: "common.white" }} />}
          iconContainerSx={{
            backgroundImage:
              "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
          }}
          title="Ustawienia konta"
          subtitle="Zarządzaj swoim profilem, awatarem i bezpieczeństwem."
        />

        <AppDialogBody sx={{ pt: 1 }}>
          {feedback && feedback.severity === "success" && (
            <AppDialogStatus severity="success">
              {feedback.message}
            </AppDialogStatus>
          )}

          {feedback &&
            feedback.severity === "error" &&
            Object.keys(fieldErrors).length === 0 && (
              <AppDialogStatus severity="error">
                {feedback.message}
              </AppDialogStatus>
            )}

          {/* Avatar Section */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 4,
              mt: 1,
            }}
          >
            <input
              type="file"
              accept="image/*"
              hidden
              ref={fileInputRef}
              onChange={handleAvatarUpload}
            />
            <Box
              sx={{
                position: "relative",
                width: 110,
                height: 110,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                borderRadius: "50%",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                border: (theme) =>
                  `4px solid ${theme.palette.background.paper}`,
                boxShadow: (theme) =>
                  theme.palette.mode === "light"
                    ? "0 4px 12px rgba(0, 0, 0, 0.08)"
                    : "0 4px 12px rgba(0, 0, 0, 0.4)",
                "&:hover": {
                  transform: "scale(1.02)",
                  "& .avatar-overlay": { opacity: 1 },
                },
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <UserAvatar
                avatarUrl={user?.avatarUrl}
                username={user?.username}
                size={102}
              />
              <Box
                className="avatar-overlay"
                sx={{
                  position: "absolute",
                  inset: 0,
                  bgcolor: "rgba(0, 0, 0, 0.6)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  opacity: avatarLoading ? 1 : 0,
                  transition: "all 0.3s",
                  backdropFilter: "blur(2px)",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  textAlign: "center",
                  p: 1,
                  pointerEvents: avatarLoading ? "auto" : "none",
                }}
              >
                {avatarLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <>
                    <UploadIcon sx={{ mb: 0.5, fontSize: 20 }} />
                    <span>Zmień zdjęcie</span>
                  </>
                )}
              </Box>
            </Box>

            <Button
              endIcon={
                <ExpandMoreIcon
                  sx={{
                    transform: presetsExpanded ? "rotate(180deg)" : "none",
                    transition: "0.2s",
                  }}
                />
              }
              onClick={() => setPresetsExpanded(!presetsExpanded)}
              sx={{
                mt: 1.5,
                fontSize: "0.8125rem",
                fontWeight: 600,
                textTransform: "none",
              }}
            >
              Wybierz z presetów
            </Button>

            <Collapse in={presetsExpanded} sx={{ width: "100%" }}>
              <Box
                sx={{
                  mt: 2,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))",
                  gap: 1.5,
                  maxWidth: 360,
                  mx: "auto",
                }}
              >
                {presets.map((p) => (
                  <Box
                    key={p}
                    onClick={() => handlePresetSelect(p)}
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      p: "2px",
                      border: "2px solid",
                      borderColor:
                        user?.avatarUrl === `preset:${p}`
                          ? "primary.main"
                          : "transparent",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      "&:hover": { transform: "scale(1.1)" },
                    }}
                  >
                    <UserAvatar avatarUrl={`preset:${p}`} size={40} />
                  </Box>
                ))}
              </Box>
            </Collapse>
          </Box>

          {/* Profile Section */}
          <FormSection title="Dane profilowe">
            <Stack spacing={2.5}>
              {/* Username Row */}
              <Box>
                {isEditingUsername ? (
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={700}
                      display="block"
                      sx={{
                        mb: 1.5,
                        letterSpacing: "0.02em",
                        textTransform: "uppercase",
                      }}
                    >
                      Edycja nazwy użytkownika
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1.25,
                        alignItems: "flex-start",
                      }}
                    >
                      <TextField
                        fullWidth
                        size="small"
                        value={username}
                        onChange={(e) => {
                          setFieldErrors((curr) => ({ ...curr, username: "" }));
                          setUsername(
                            e.target.value.slice(0, INPUT_LIMITS.username),
                          );
                        }}
                        placeholder="Wprowadź nową nazwę"
                        autoFocus
                        error={Boolean(fieldErrors.username)}
                        helperText={
                          fieldErrors.username ||
                          `Nazwa widoczna dla innych. Max ${INPUT_LIMITS.username} znaków.`
                        }
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            bgcolor: "background.paper",
                            ...(fieldErrors.username && {
                              bgcolor: alpha("#EF4444", 0.02),
                              "& fieldset": {
                                borderColor: alpha("#EF4444", 0.2),
                              },
                            }),
                          },
                        }}
                      />
                      <Stack direction="row" spacing={0.75} sx={{ mt: 0.5 }}>
                        <IconButton
                          onClick={handleSaveProfile}
                          disabled={profileLoading}
                          size="small"
                          sx={{
                            bgcolor: alpha("#10b981", 0.08),
                            color: "#10b981",
                            "&:hover": { bgcolor: alpha("#10b981", 0.16) },
                          }}
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() => {
                            setIsEditingUsername(false);
                            setUsername(user?.username || "");
                            setFieldErrors((curr) => ({
                              ...curr,
                              username: "",
                            }));
                          }}
                          size="small"
                          sx={{
                            bgcolor: alpha("#64748b", 0.08),
                            color: "#64748b",
                            "&:hover": { bgcolor: alpha("#64748b", 0.16) },
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      minHeight: 48,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        sx={{
                          color: "text.secondary",
                          textTransform: "uppercase",
                        }}
                      >
                        Nazwa użytkownika
                      </Typography>
                      <Typography fontWeight={600}>{user?.username}</Typography>
                    </Box>
                    <Button
                      size="small"
                      onClick={() => {
                        setIsEditingUsername(true);
                        resetFeedback();
                      }}
                      sx={{ textTransform: "none", fontWeight: 600 }}
                    >
                      Zmień
                    </Button>
                  </Box>
                )}
              </Box>

              {/* Email Row */}
              <Box>
                {isEditingEmail ? (
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={700}
                      display="block"
                      sx={{
                        mb: 1.5,
                        letterSpacing: "0.02em",
                        textTransform: "uppercase",
                      }}
                    >
                      Edycja adresu e-mail
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1.25,
                        alignItems: "flex-start",
                      }}
                    >
                      <Stack spacing={1.5} flex={1}>
                        <TextField
                          fullWidth
                          size="small"
                          value={email}
                          onChange={(e) => {
                            setFieldErrors((curr) => ({ ...curr, email: "" }));
                            setEmail(
                              e.target.value.slice(0, INPUT_LIMITS.email),
                            );
                          }}
                          placeholder="Wprowadź nowy email"
                          autoFocus
                          error={Boolean(fieldErrors.email)}
                          helperText={
                            fieldErrors.email ||
                            "Adres do logowania i odzyskiwania hasła."
                          }
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              bgcolor: "background.paper",
                              ...(fieldErrors.email && {
                                bgcolor: alpha("#EF4444", 0.02),
                                "& fieldset": {
                                  borderColor: alpha("#EF4444", 0.2),
                                },
                              }),
                            },
                          }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          value={confirmEmail}
                          onChange={(e) => {
                            setFieldErrors((curr) => ({
                              ...curr,
                              confirmEmail: "",
                            }));
                            setConfirmEmail(
                              e.target.value.slice(0, INPUT_LIMITS.email),
                            );
                          }}
                          placeholder="Powtórz nowy email"
                          error={Boolean(fieldErrors.confirmEmail)}
                          helperText={fieldErrors.confirmEmail}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              bgcolor: "background.paper",
                              ...(fieldErrors.confirmEmail && {
                                bgcolor: alpha("#EF4444", 0.02),
                                "& fieldset": {
                                  borderColor: alpha("#EF4444", 0.2),
                                },
                              }),
                            },
                          }}
                        />
                      </Stack>
                      <Stack direction="row" spacing={0.75} sx={{ mt: 0.5 }}>
                        <IconButton
                          onClick={handleSaveProfile}
                          disabled={profileLoading}
                          size="small"
                          sx={{
                            bgcolor: alpha("#10b981", 0.08),
                            color: "#10b981",
                            "&:hover": { bgcolor: alpha("#10b981", 0.16) },
                          }}
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() => {
                            setIsEditingEmail(false);
                            setEmail(user?.email || "");
                            setConfirmEmail("");
                            setFieldErrors((curr) => ({
                              ...curr,
                              email: "",
                              confirmEmail: "",
                            }));
                          }}
                          size="small"
                          sx={{
                            bgcolor: alpha("#64748b", 0.08),
                            color: "#64748b",
                            "&:hover": { bgcolor: alpha("#64748b", 0.16) },
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      minHeight: 48,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        sx={{
                          color: "text.secondary",
                          textTransform: "uppercase",
                        }}
                      >
                        Email
                      </Typography>
                      <Typography fontWeight={600}>{user?.email}</Typography>
                    </Box>
                    <Button
                      size="small"
                      onClick={() => {
                        setIsEditingEmail(true);
                        setEmail("");
                        setConfirmEmail("");
                        resetFeedback();
                      }}
                      sx={{ textTransform: "none", fontWeight: 600 }}
                    >
                      Zmień
                    </Button>
                  </Box>
                )}
              </Box>
            </Stack>
          </FormSection>

          {/* Security Section */}
          <FormSection title="Bezpieczeństwo" sx={{ mt: 3 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: passwordExpanded ? 2 : 0,
              }}
            >
              <Box>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  sx={{ color: "text.secondary", textTransform: "uppercase" }}
                >
                  Hasło
                </Typography>
                <Typography fontWeight={600}>••••••••••••</Typography>
              </Box>
              <Button
                size="small"
                onClick={() => {
                  setPasswordExpanded(!passwordExpanded);
                  resetFeedback();
                }}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                {passwordExpanded ? "Anuluj" : "Zmień hasło"}
              </Button>
            </Box>

            <Collapse in={passwordExpanded}>
              <Stack spacing={2.5} sx={{ mt: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={700}
                  display="block"
                  sx={{ letterSpacing: "0.02em", textTransform: "uppercase" }}
                >
                  Zmiana hasła
                </Typography>

                <TextField
                  label="Obecne hasło"
                  type={showPasswords ? "text" : "password"}
                  fullWidth
                  size="small"
                  value={oldPassword}
                  onChange={(e) => {
                    setFieldErrors((curr) => ({ ...curr, oldPassword: "" }));
                    setOldPassword(e.target.value);
                  }}
                  error={Boolean(fieldErrors.oldPassword)}
                  helperText={fieldErrors.oldPassword}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "background.paper",
                      ...(fieldErrors.oldPassword && {
                        bgcolor: alpha("#EF4444", 0.02),
                        "& fieldset": { borderColor: alpha("#EF4444", 0.2) },
                      }),
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPasswords(!showPasswords)}
                          edge="end"
                          size="small"
                        >
                          {showPasswords ? (
                            <VisibilityOffIcon />
                          ) : (
                            <VisibilityIcon />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Box>
                  <TextField
                    label="Nowe hasło"
                    type={showPasswords ? "text" : "password"}
                    fullWidth
                    size="small"
                    value={newPassword}
                    onChange={(e) => {
                      setFieldErrors((curr) => ({ ...curr, newPassword: "" }));
                      setNewPassword(e.target.value);
                    }}
                    error={Boolean(fieldErrors.newPassword)}
                    helperText={fieldErrors.newPassword}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "background.paper",
                        ...(fieldErrors.newPassword && {
                          bgcolor: alpha("#EF4444", 0.02),
                          "& fieldset": { borderColor: alpha("#EF4444", 0.2) },
                        }),
                      },
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPasswords(!showPasswords)}
                            edge="end"
                            size="small"
                          >
                            {showPasswords ? (
                              <VisibilityOffIcon />
                            ) : (
                              <VisibilityIcon />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  {newPassword && (
                    <Box sx={{ mt: 1, px: 0.5 }}>
                      <Box
                        sx={{
                          height: 3,
                          bgcolor: alpha(theme.palette.text.primary, 0.08),
                          borderRadius: 999,
                          overflow: "hidden",
                          mb: 0.5,
                        }}
                      >
                        <Box
                          sx={{
                            height: "100%",
                            width: `${passwordStrength}%`,
                            bgcolor: strengthColor(),
                            transition: "all 0.3s ease",
                          }}
                        />
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary", fontWeight: 500 }}
                      >
                        Siła hasła: {strengthLabel()}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <TextField
                  label="Powtórz nowe hasło"
                  type="password"
                  fullWidth
                  size="small"
                  value={confirmPassword}
                  onChange={(e) => {
                    setFieldErrors((curr) => ({
                      ...curr,
                      confirmPassword: "",
                    }));
                    setConfirmPassword(e.target.value);
                  }}
                  error={Boolean(fieldErrors.confirmPassword)}
                  helperText={fieldErrors.confirmPassword}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "background.paper",
                      ...(fieldErrors.confirmPassword && {
                        bgcolor: alpha("#EF4444", 0.02),
                        "& fieldset": { borderColor: alpha("#EF4444", 0.2) },
                      }),
                    },
                  }}
                />
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleSavePassword}
                  disabled={passwordLoading}
                  sx={{
                    py: 1.25,
                    borderRadius: "12px",
                    fontWeight: 700,
                    textTransform: "none",
                    boxShadow: (theme) =>
                      `0 8px 20px ${alpha(theme.palette.primary.main, 0.25)}`,
                  }}
                >
                  {passwordLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    "Zapisz nowe hasło"
                  )}
                </Button>
              </Stack>
            </Collapse>
          </FormSection>
        </AppDialogBody>

        <AppDialogFooter>
          <Button
            onClick={closeDialog}
            sx={{
              fontWeight: 700,
              textTransform: "none",
              color: "text.secondary",
              px: 3,
            }}
          >
            Zamknij
          </Button>
        </AppDialogFooter>
      </AppDialog>

      <Snackbar
        open={avatarSnackbar}
        autoHideDuration={3500}
        onClose={() => setAvatarSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setAvatarSnackbar(false)}
          sx={{ borderRadius: 2 }}
        >
          Awatar został zaktualizowany.
        </Alert>
      </Snackbar>
    </>
  );
}
