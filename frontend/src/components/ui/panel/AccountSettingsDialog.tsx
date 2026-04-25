import { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Collapse,
} from "@mui/material";
import {
  LockOutlined as LockIcon,
  ManageAccountsOutlined as ManageAccountsIcon,
  SaveOutlined as SaveIcon,
  CloudUploadOutlined as UploadIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { userService, type UserProfile } from "@/api/userService";
import {
  AppDialog,
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader,
  AppDialogStatus,
} from "@/components/ui/dialog/AppDialog";
import {
  FormActions,
  FormField,
  FormSection,
} from "@/components/ui/form/FormLayout";
import { panelFooterButtonSx } from "@/components/ui/panel/panelStyles";
import { getErrorMessage } from "@/utils/dashboardUtils";
import { UserAvatar } from "@/components/ui/avatar/UserAvatar";

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
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [presetsExpanded, setPresetsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const presets = Array.from({ length: 12 }, (_, i) => `avatar_${i + 1}`);

  useEffect(() => {
    if (!open) {
      return;
    }

    setUsername(user?.username ?? "");
    setEmail(user?.email ?? "");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setFeedback(null);
  }, [open, user]);

  const closeDialog = () => {
    if (profileLoading || passwordLoading) {
      return;
    }
    onClose();
  };

  const saveProfile = async () => {
    if (!user || profileLoading) {
      return;
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    if (!trimmedUsername || !trimmedEmail) {
      setFeedback({
        severity: "error",
        message: "Podaj nazwę użytkownika i adres e-mail.",
      });
      return;
    }

    setFeedback(null);
    setProfileLoading(true);
    try {
      const updatedUser = await userService.updateUser(user.id, {
        username: trimmedUsername,
        email: trimmedEmail,
      });
      onUserUpdated(updatedUser);
      setFeedback({
        severity: "success",
        message: "Dane konta zostały zapisane.",
      });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: getErrorMessage(error, "Nie udało się zapisać danych konta."),
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const savePassword = async () => {
    if (!user || passwordLoading) {
      return;
    }

    if (!oldPassword || !newPassword || !confirmPassword) {
      setFeedback({
        severity: "error",
        message: "Uzupełnij wszystkie pola zmiany hasła.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({
        severity: "error",
        message: "Nowe hasło i powtórzenie muszą być takie same.",
      });
      return;
    }

    setFeedback(null);
    setPasswordLoading(true);
    try {
      await userService.changePassword(user.id, {
        oldPassword,
        newPassword,
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setFeedback({
        severity: "success",
        message: "Hasło zostało zmienione.",
      });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: getErrorMessage(error, "Nie udało się zmienić hasła."),
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
        message: "Plik jest za duży. Maksymalny rozmiar to 2 MB.",
      });
      return;
    }

    setFeedback(null);
    setAvatarLoading(true);
    try {
      const updatedUser = await userService.uploadAvatar(user.id, file);
      onUserUpdated(updatedUser);
      setFeedback({
        severity: "success",
        message: "Awatar został zaktualizowany.",
      });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: getErrorMessage(error, "Nie udało się wgrać awatara."),
      });
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handlePresetSelect = async (presetName: string) => {
    if (!user) return;

    setFeedback(null);
    setAvatarLoading(true);
    try {
      const updatedUser = await userService.setPresetAvatar(
        user.id,
        presetName,
      );
      onUserUpdated(updatedUser);
      setFeedback({
        severity: "success",
        message: "Awatar został zaktualizowany.",
      });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: getErrorMessage(error, "Nie udało się zmienić awatara."),
      });
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <AppDialog open={open} onClose={closeDialog} maxWidth="sm">
      <AppDialogHeader
        icon={<ManageAccountsIcon />}
        title="Ustawienia konta"
        subtitle="Zmień swoje dane lub hasło."
      />
      <AppDialogBody>
        {feedback && (
          <AppDialogStatus severity={feedback.severity}>
            {feedback.message}
          </AppDialogStatus>
        )}
        <Stack spacing={2.25}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 1,
            }}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              ref={fileInputRef}
              onChange={handleAvatarUpload}
            />
            <Tooltip title="Kliknij, aby wgrać awatar z dysku">
              <IconButton
                onClick={() => fileInputRef.current?.click()}
                disabled={!user || avatarLoading}
                sx={{
                  p: 0,
                  position: "relative",
                  "&:hover::after": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: "rgba(0,0,0,0.4)",
                    borderRadius: "50%",
                    transition: "background-color 0.2s",
                  },
                  "&:hover .upload-icon": { opacity: 1 },
                }}
              >
                <UserAvatar
                  avatarUrl={user?.avatarUrl}
                  username={user?.username}
                  size={100}
                />
                <UploadIcon
                  className="upload-icon"
                  sx={{
                    position: "absolute",
                    color: "white",
                    opacity: 0,
                    transition: "opacity 0.2s",
                    zIndex: 1,
                    fontSize: 32,
                  }}
                />
              </IconButton>
            </Tooltip>

            <Button
              size="small"
              onClick={() => setPresetsExpanded(!presetsExpanded)}
              sx={{ mt: 1.5, textTransform: "none" }}
              endIcon={
                <ExpandMoreIcon
                  sx={{
                    transform: presetsExpanded ? "rotate(180deg)" : "none",
                    transition: "0.2s",
                  }}
                />
              }
            >
              Wybierz z wbudowanych
            </Button>

            <Collapse in={presetsExpanded}>
              <Grid
                container
                spacing={1}
                justifyContent="center"
                sx={{ mt: 1, maxWidth: 320 }}
              >
                {presets.map((preset) => (
                  <Grid key={preset}>
                    <IconButton
                      onClick={() => handlePresetSelect(preset)}
                      disabled={!user || avatarLoading}
                      sx={{
                        p: 0.5,
                        border:
                          user?.avatarUrl === `preset:${preset}`
                            ? "2px solid"
                            : "2px solid transparent",
                        borderColor: "primary.main",
                        transition: "transform 0.2s",
                        "&:hover": { transform: "scale(1.1)" },
                      }}
                    >
                      <UserAvatar avatarUrl={`preset:${preset}`} size={48} />
                    </IconButton>
                  </Grid>
                ))}
              </Grid>
            </Collapse>
          </Box>

          <FormSection title="Dane konta">
            <Stack spacing={2}>
              <FormField>
                <TextField
                  label="Nazwa użytkownika"
                  name="account-settings-username"
                  autoComplete="off"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  disabled={!user || profileLoading}
                  fullWidth
                />
              </FormField>
              <FormField>
                <TextField
                  label="E-mail"
                  name="account-settings-email"
                  autoComplete="off"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={!user || profileLoading}
                  fullWidth
                />
              </FormField>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={saveProfile}
                disabled={!user || profileLoading}
                sx={{ ...panelFooterButtonSx, alignSelf: "flex-end" }}
              >
                {profileLoading ? "Zapisywanie..." : "Zapisz dane"}
              </Button>
            </Stack>
          </FormSection>

          <FormSection title="Zmiana hasła">
            <Stack spacing={2}>
              <FormField>
                <TextField
                  label="Obecne hasło"
                  name="account-settings-current-password"
                  autoComplete="current-password"
                  type="password"
                  value={oldPassword}
                  onChange={(event) => setOldPassword(event.target.value)}
                  disabled={!user || passwordLoading}
                  fullWidth
                />
              </FormField>
              <FormField>
                <TextField
                  label="Nowe hasło"
                  name="account-settings-new-password"
                  autoComplete="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  disabled={!user || passwordLoading}
                  fullWidth
                />
              </FormField>
              <FormField>
                <TextField
                  label="Powtórz nowe hasło"
                  name="account-settings-confirm-password"
                  autoComplete="new-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={!user || passwordLoading}
                  fullWidth
                />
              </FormField>
              <Button
                variant="outlined"
                startIcon={<LockIcon />}
                onClick={savePassword}
                disabled={!user || passwordLoading}
                sx={{ ...panelFooterButtonSx, alignSelf: "flex-end" }}
              >
                {passwordLoading ? "Zapisywanie..." : "Zmień hasło"}
              </Button>
            </Stack>
          </FormSection>
        </Stack>
      </AppDialogBody>
      <AppDialogFooter>
        <FormActions>
          <Button
            onClick={closeDialog}
            disabled={profileLoading || passwordLoading}
            sx={{ ...panelFooterButtonSx, color: "text.secondary" }}
          >
            Zamknij
          </Button>
        </FormActions>
      </AppDialogFooter>
    </AppDialog>
  );
}
