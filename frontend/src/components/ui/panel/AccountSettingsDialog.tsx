import { useEffect, useState } from "react";
import { Button, Stack, TextField } from "@mui/material";
import {
  LockOutlined as LockIcon,
  ManageAccountsOutlined as ManageAccountsIcon,
  SaveOutlined as SaveIcon,
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
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

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
