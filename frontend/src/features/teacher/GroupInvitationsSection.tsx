import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  AddLinkOutlined as AddLinkIcon,
  BlockOutlined as BlockIcon,
  CloseOutlined as CloseIcon,
  ContentCopyOutlined as CopyIcon,
  LinkOutlined as LinkIcon,
  QrCodeOutlined as QrIcon,
  RefreshOutlined as RefreshIcon,
} from "@mui/icons-material";
import QRCode from "react-qr-code";
import {
  invitationService,
  type InvitationResponse,
} from "@/api/invitationService";
import { ApiError } from "@/api/apiClient";
import { getApiErrorMessage } from "@/utils/dashboardUtils";

interface Props {
  groupPublicId: string;
}

const DISMISSED_KEY = (groupId: string) =>
  `dismissed_invitations_${groupId}`;

const loadDismissed = (groupId: string): Set<string> => {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY(groupId));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
};

const saveDismissed = (groupId: string, tokens: Set<string>) => {
  localStorage.setItem(DISMISSED_KEY(groupId), JSON.stringify([...tokens]));
};

export function GroupInvitationsSection({ groupPublicId }: Props) {
  const theme = useTheme();

  const [invitations, setInvitations] = useState<InvitationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [maxUses, setMaxUses] = useState("10");
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [qrToken, setQrToken] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const buildInviteUrl = (token: string) =>
    `${window.location.origin}/register?token=${token}`;

  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await invitationService.getInvitations(groupPublicId);
      const dismissed = loadDismissed(groupPublicId);
      setInvitations(data.filter((inv) => !dismissed.has(inv.token)));
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(
          getApiErrorMessage(err, "Nie udało się pobrać zaproszeń."),
        );
      } else {
        setError("Nie udało się pobrać zaproszeń.");
      }
    } finally {
      setLoading(false);
    }
  }, [groupPublicId]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleCreate = async () => {
    setCreateError(null);
    const parsedMax = parseInt(maxUses, 10);
    if (!parsedMax || parsedMax < 1) {
      setCreateError("Podaj poprawną liczbę użyć (min. 1).");
      return;
    }
    if (!expiresAt) {
      setCreateError("Podaj datę wygaśnięcia.");
      return;
    }
    if (new Date(expiresAt) <= new Date()) {
      setCreateError("Data wygaśnięcia musi być w przyszłości.");
      return;
    }
    setCreating(true);
    try {
      const inv = await invitationService.createInvitation(groupPublicId, {
        maxUses: parsedMax,
        expiresAt: new Date(expiresAt).toISOString().replace("Z", ""),
      });
      setInvitations((prev) => [inv, ...prev]);
      setCreateOpen(false);
      setMaxUses("10");
      setExpiresAt("");
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setCreateError(
          getApiErrorMessage(err, "Nie udało się utworzyć zaproszenia."),
        );
      } else {
        setCreateError("Nie udało się utworzyć zaproszenia.");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (token: string) => {
    try {
      await invitationService.deactivateInvitation(groupPublicId, token);
      setInvitations((prev) =>
        prev.map((inv) =>
          inv.token === token ? { ...inv, isActive: false } : inv,
        ),
      );
    } catch {
      // silent — user still sees the list
    }
  };

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(buildInviteUrl(token));
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Stack direction="row" alignItems="center" gap={1}>
          <LinkIcon fontSize="small" color="primary" />
          <Typography variant="subtitle1" fontWeight={600}>
            Zaproszenia
          </Typography>
        </Stack>
        <Stack direction="row" gap={1}>
          <Tooltip title="Odśwież">
            <IconButton size="small" onClick={fetchInvitations}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddLinkIcon />}
            onClick={() => setCreateOpen(true)}
          >
            Generuj link
          </Button>
        </Stack>
      </Stack>

      {loading && (
        <Box display="flex" justifyContent="center" py={2}>
          <CircularProgress size={24} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && invitations.length === 0 && !error && (
        <Typography variant="body2" color="text.secondary">
          Brak zaproszeń. Wygeneruj pierwszy link zaproszenia.
        </Typography>
      )}

      <Stack gap={1.5}>
        {invitations.map((inv) => {
          const expired = new Date(inv.expiresAt) < new Date();
          const limitReached = inv.usedCount >= inv.maxUses;
          const inactive = !inv.isActive || expired || limitReached;
          const url = buildInviteUrl(inv.token);

          return (
            <Box
              key={inv.token}
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                bgcolor: inactive
                  ? alpha(theme.palette.action.disabledBackground, 0.5)
                  : alpha(theme.palette.primary.main, 0.04),
                opacity: inactive ? 0.7 : 1,
              }}
            >
              <Stack
                direction="row"
                alignItems="flex-start"
                justifyContent="space-between"
                gap={1}
              >
                <Box minWidth={0} flex={1}>
                  <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
                    <Chip
                      size="small"
                      label={
                        !inv.isActive
                          ? "Dezaktywowane"
                          : expired
                            ? "Wygasłe"
                            : limitReached
                              ? "Limit wyczerpany"
                              : "Aktywne"
                      }
                      color={inactive ? "default" : "success"}
                      variant={inactive ? "outlined" : "filled"}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {inv.usedCount}/{inv.maxUses} użyć · wygasa{" "}
                      {formatDate(inv.expiresAt)}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                      color: "text.secondary",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {url}
                  </Typography>
                </Box>

                <Stack direction="row" gap={0.5} flexShrink={0}>
                  {!inactive && (
                    <>
                      <Tooltip title={copied === inv.token ? "Skopiowano!" : "Kopiuj link"}>
                        <IconButton size="small" onClick={() => handleCopy(inv.token)}>
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Pokaż QR">
                        <IconButton
                          size="small"
                          onClick={() => setQrToken(inv.token)}
                        >
                          <QrIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Dezaktywuj">
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => handleDeactivate(inv.token)}
                        >
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  {inactive && (
                    <Tooltip title="Usuń z listy">
                      <IconButton
                        size="small"
                        onClick={() => {
                          const dismissed = loadDismissed(groupPublicId);
                          dismissed.add(inv.token);
                          saveDismissed(groupPublicId, dismissed);
                          setInvitations((prev) =>
                            prev.filter((i) => i.token !== inv.token),
                          );
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </Stack>
            </Box>
          );
        })}
      </Stack>

      {/* Create invitation dialog */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Nowe zaproszenie</DialogTitle>
        <DialogContent>
          <Stack gap={2} mt={1}>
            {createError && <Alert severity="error">{createError}</Alert>}
            <TextField
              label="Maksymalna liczba użyć"
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              inputProps={{ min: 1 }}
              fullWidth
            />
            <TextField
              label="Data wygaśnięcia"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{
                min: new Date(Date.now() + 60_000).toISOString().slice(0, 16),
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} disabled={creating}>
            Anuluj
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? <CircularProgress size={20} /> : "Generuj"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR dialog */}
      <Dialog
        open={qrToken !== null}
        onClose={() => setQrToken(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          backdrop: { sx: { backdropFilter: "blur(6px)" } },
        }}
      >
        <DialogTitle>Kod QR zaproszenia</DialogTitle>
        <DialogContent>
          <Stack alignItems="center" gap={2} py={1}>
            {qrToken && (
              <>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "white",
                    borderRadius: 2,
                    display: "inline-block",
                  }}
                >
                  <QRCode value={buildInviteUrl(qrToken)} size={200} />
                </Box>
                <Divider flexItem />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  align="center"
                  sx={{ wordBreak: "break-all" }}
                >
                  {buildInviteUrl(qrToken)}
                </Typography>
                <Button
                  size="small"
                  startIcon={<CopyIcon />}
                  onClick={() => handleCopy(qrToken)}
                >
                  {copied === qrToken ? "Skopiowano!" : "Kopiuj link"}
                </Button>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setQrToken(null)}>Zamknij</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
