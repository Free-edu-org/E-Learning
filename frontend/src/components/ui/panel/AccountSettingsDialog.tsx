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
import { useTheme } from "@mui/material/styles";
import { userService, type UserProfile } from "@/api/userService";
import { AppDialog, AppDialogStatus } from "@/components/ui/dialog/AppDialog";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/utils/dashboardUtils";
import { UserAvatar } from "@/components/ui/avatar/UserAvatar";

import "./AccountSettingsDialog.css";

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

export function AccountSettingsDialog({
  open,
  user,
  onClose,
  onUserUpdated,
}: AccountSettingsDialogProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
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
      return;
    }

    setUsername(user?.username ?? "");
    setEmail(user?.email ?? "");
    setConfirmEmail("");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setFeedback(null);
  }, [open, user]);

  const closeDialog = () => {
    if (profileLoading || passwordLoading || avatarLoading) return;
    onClose();
  };

  const resetFeedback = () => setFeedback(null);

  const handleSaveProfile = async () => {
    if (!user || profileLoading) return;

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (isEditingUsername && !trimmedUsername) {
      setFeedback({
        severity: "error",
        message: "Nazwa użytkownika nie może być pusta.",
      });
      return;
    }

    if (isEditingEmail) {
      if (!trimmedEmail) {
        setFeedback({
          severity: "error",
          message: "Email nie może być pusty.",
        });
        return;
      }
      if (trimmedEmail !== confirmEmail.trim()) {
        return;
      }
    }

    setFeedback(null);
    setProfileLoading(true);
    try {
      const updatedUser = await userService.updateUser(user.publicId, {
        username: isEditingUsername ? trimmedUsername : user.username,
        email: isEditingEmail ? trimmedEmail : user.email,
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
      setFeedback({
        severity: "error",
        message: getErrorMessage(error, "Błąd podczas aktualizacji profilu."),
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSavePassword = async () => {
    if (!user || passwordLoading) return;

    if (!oldPassword || !newPassword || !confirmPassword) {
      setFeedback({
        severity: "error",
        message: "Uzupełnij wszystkie pola hasła.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      return;
    }

    setFeedback(null);
    setPasswordLoading(true);
    try {
      await userService.changePassword(user.publicId, { oldPassword, newPassword });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordExpanded(false);
      setFeedback({
        severity: "success",
        message: "Hasło zostało zmienione pomyślnie.",
      });
      setTimeout(() => logout(), 800);
    } catch (error) {
      setFeedback({
        severity: "error",
        message: getErrorMessage(error, "Błąd podczas zmiany hasła."),
      });
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
    if (newPassword.length > 6) score += 25;
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

  const passwordMatchError = useMemo(() => {
    if (!confirmPassword) return "";
    return newPassword !== confirmPassword ? "Hasła nie są identyczne" : "";
  }, [newPassword, confirmPassword]);

  const emailMatchError = useMemo(() => {
    if (!confirmEmail) return "";
    return email !== confirmEmail ? "Adresy email nie są identyczne" : "";
  }, [email, confirmEmail]);

  return (
    <>
      <AppDialog
        open={open}
        onClose={closeDialog}
        maxWidth="sm"
        paperSx={{ borderRadius: "24px" }}
        PaperProps={{
          className: `modern-dialog-paper animate-in ${isDark ? "dark" : ""}`,
        }}
      >
        <Box className="settings-header">
          <Box className="settings-header-content">
            <Box className="settings-header-icon-box">
              <SettingsIcon />
            </Box>
            <Typography className="settings-header-title">
              Ustawienia konta
            </Typography>
            <Typography className="settings-header-subtitle">
              Zarządzaj swoim profilem i bezpieczeństwem
            </Typography>
          </Box>
        </Box>

        <Box className="settings-body">
          {feedback && feedback.severity === "success" && (
            <AppDialogStatus severity="success">
              {feedback.message}
            </AppDialogStatus>
          )}

          {feedback &&
            feedback.severity === "error" &&
            !passwordExpanded &&
            !isEditingEmail &&
            !isEditingUsername && (
              <AppDialogStatus severity="error">
                {feedback.message}
              </AppDialogStatus>
            )}

          {/* Avatar Section */}
          <Box className="avatar-section">
            <input
              type="file"
              accept="image/*"
              hidden
              ref={fileInputRef}
              onChange={handleAvatarUpload}
            />
            <Box
              className="avatar-container"
              onClick={() => fileInputRef.current?.click()}
            >
              <UserAvatar
                avatarUrl={user?.avatarUrl}
                username={user?.username}
                size={102}
              />
              {avatarLoading ? (
                <Box className="avatar-overlay" style={{ opacity: 1 }}>
                  <CircularProgress size={24} color="inherit" />
                </Box>
              ) : (
                <Box className="avatar-overlay">
                  <UploadIcon />
                  <span>Zmień zdjęcie</span>
                </Box>
              )}
            </Box>

            <Button
              className="presets-toggle"
              endIcon={
                <ExpandMoreIcon
                  style={{
                    transform: presetsExpanded ? "rotate(180deg)" : "none",
                    transition: "0.2s",
                  }}
                />
              }
              onClick={() => setPresetsExpanded(!presetsExpanded)}
            >
              Wybierz z presetów
            </Button>

            <Collapse in={presetsExpanded}>
              <Box className="presets-grid">
                {presets.map((p) => (
                  <Box
                    key={p}
                    className={`preset-item ${user?.avatarUrl === `preset:${p}` ? "active" : ""}`}
                    onClick={() => handlePresetSelect(p)}
                  >
                    <UserAvatar avatarUrl={`preset:${p}`} size={40} />
                  </Box>
                ))}
              </Box>
            </Collapse>
          </Box>

          {/* Profile Section */}
          <Typography className="section-label">Profil</Typography>
          <Box className="settings-group">
            {/* Username Row */}
            <Box className="settings-row">
              {isEditingUsername ? (
                <Box className="inline-edit-box">
                  <Typography className="edit-context-label">
                    Edycja nazwy użytkownika
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1.5,
                      alignItems: "flex-start",
                      width: "100%",
                    }}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      className="modern-field"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        resetFeedback();
                      }}
                      placeholder="Nazwa użytkownika"
                      autoFocus
                      error={
                        feedback?.severity === "error" &&
                        (feedback.message.includes("użytkownik") ||
                          feedback.message.includes("username"))
                      }
                      helperText={
                        feedback?.severity === "error" &&
                        (feedback.message.includes("użytkownik") ||
                          feedback.message.includes("username"))
                          ? feedback.message
                          : ""
                      }
                    />
                    <Box className="edit-actions" sx={{ mt: 0.5 }}>
                      <IconButton
                        onClick={handleSaveProfile}
                        disabled={profileLoading}
                        className="action-icon-btn success"
                        size="small"
                      >
                        <CheckIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          setIsEditingUsername(false);
                          setUsername(user?.username || "");
                          resetFeedback();
                        }}
                        className="action-icon-btn cancel"
                        size="small"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <>
                  <Box className="row-content">
                    <Typography className="row-label">
                      Nazwa użytkownika
                    </Typography>
                    <Typography className="row-value">
                      {user?.username}
                    </Typography>
                  </Box>
                  <Button
                    className="change-btn"
                    onClick={() => {
                      setIsEditingUsername(true);
                      resetFeedback();
                    }}
                  >
                    Zmień
                  </Button>
                </>
              )}
            </Box>

            {/* Email Row */}
            <Box className="settings-row">
              {isEditingEmail ? (
                <Box className="inline-edit-box" style={{ width: "100%" }}>
                  <Typography className="edit-context-label">
                    Edycja adresu e-mail
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <Stack spacing={1.25} flex={1}>
                      <TextField
                        fullWidth
                        size="small"
                        className="modern-field"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          resetFeedback();
                        }}
                        placeholder="Nowy email"
                        autoFocus
                      />
                      <TextField
                        fullWidth
                        size="small"
                        className="modern-field"
                        value={confirmEmail}
                        onChange={(e) => {
                          setConfirmEmail(e.target.value);
                          resetFeedback();
                        }}
                        placeholder="Powtórz nowy email"
                        error={
                          !!emailMatchError ||
                          (feedback?.severity === "error" &&
                            feedback.message.includes("email"))
                        }
                        helperText={
                          emailMatchError ||
                          (feedback?.severity === "error" &&
                          feedback.message.includes("email")
                            ? feedback.message
                            : "")
                        }
                      />
                    </Stack>
                    <Stack spacing={1} sx={{ justifyContent: "center" }}>
                      <IconButton
                        onClick={() => {
                          setIsEditingEmail(false);
                          setEmail(user?.email || "");
                          setConfirmEmail("");
                          resetFeedback();
                        }}
                        className="action-icon-btn cancel"
                        size="small"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={handleSaveProfile}
                        disabled={profileLoading || !!emailMatchError}
                        className="action-icon-btn success"
                        size="small"
                      >
                        <CheckIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>
                </Box>
              ) : (
                <>
                  <Box className="row-content">
                    <Typography className="row-label">Email</Typography>
                    <Typography className="row-value">{user?.email}</Typography>
                  </Box>
                  <Button
                    className="change-btn"
                    onClick={() => {
                      setIsEditingEmail(true);
                      setEmail("");
                      setConfirmEmail("");
                      resetFeedback();
                    }}
                  >
                    Zmień
                  </Button>
                </>
              )}
            </Box>
          </Box>

          {/* Security Section */}
          <Typography className="section-label">Bezpieczeństwo</Typography>
          <Box className="settings-group">
            <Box className="settings-row">
              <Box className="row-content">
                <Typography className="row-label">Hasło</Typography>
                <Typography className="row-value">••••••••••••</Typography>
              </Box>
              <Button
                className="change-btn"
                onClick={() => {
                  setPasswordExpanded(!passwordExpanded);
                  resetFeedback();
                }}
              >
                {passwordExpanded ? "Anuluj" : "Zmień hasło"}
              </Button>
            </Box>

            <Collapse in={passwordExpanded}>
              <Box className="password-panel">
                <Stack className="password-form">
                  <Typography className="edit-context-label" sx={{ mb: 1 }}>
                    Zmiana hasła
                  </Typography>
                  {feedback &&
                    feedback.severity === "error" &&
                    passwordExpanded &&
                    !feedback.message.includes("hasło") &&
                    !feedback.message.includes("password") && (
                      <AppDialogStatus severity="error">
                        {feedback.message}
                      </AppDialogStatus>
                    )}

                  <TextField
                    label="Obecne hasło"
                    type={showPasswords ? "text" : "password"}
                    fullWidth
                    size="small"
                    className="modern-field"
                    value={oldPassword}
                    onChange={(e) => {
                      setOldPassword(e.target.value);
                      resetFeedback();
                    }}
                    error={
                      feedback?.severity === "error" &&
                      (feedback.message.includes("hasło") ||
                        feedback.message.includes("password"))
                    }
                    helperText={
                      feedback?.severity === "error" &&
                      (feedback.message.includes("hasło") ||
                        feedback.message.includes("password"))
                        ? feedback.message
                        : ""
                    }
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
                  <Box className="password-field-wrapper">
                    <TextField
                      label="Nowe hasło"
                      type={showPasswords ? "text" : "password"}
                      fullWidth
                      size="small"
                      className="modern-field"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        resetFeedback();
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
                      <Box className="strength-container">
                        <Box className="strength-bar">
                          <Box
                            className="strength-progress"
                            style={{
                              width: `${passwordStrength}%`,
                              backgroundColor: strengthColor(),
                            }}
                          />
                        </Box>
                        <Typography className="strength-text">
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
                    className="modern-field"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      resetFeedback();
                    }}
                    error={!!passwordMatchError}
                    helperText={passwordMatchError}
                  />
                  <Button
                    className="btn-primary"
                    style={{ alignSelf: "flex-end", marginTop: "8px" }}
                    onClick={handleSavePassword}
                    disabled={passwordLoading || !!passwordMatchError}
                  >
                    {passwordLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      "Zapisz nowe hasło"
                    )}
                  </Button>
                </Stack>
              </Box>
            </Collapse>
          </Box>
        </Box>

        <Box className="footer">
          <Stack
            direction="row"
            justifyContent="flex-end"
            spacing={2}
            width="100%"
          >
            <Button className="cancel-btn" onClick={closeDialog}>
              Zamknij
            </Button>
          </Stack>
        </Box>
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
