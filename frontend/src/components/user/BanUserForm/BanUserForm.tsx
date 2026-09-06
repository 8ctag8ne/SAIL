import React, { useState } from "react";
import { Box, TextField, Button, Typography, Paper, IconButton, DialogTitle } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LoadingIndicator from "../../ui/LoadingIndicator";

type BanUserFormProps = {
  userName: string;
  onSubmit: (reason: string) => Promise<void>;
  onClose?: () => void;
};

const BanUserForm: React.FC<BanUserFormProps> = ({ userName, onSubmit, onClose }) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(reason.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        width: 460,
        maxWidth: "100%",
        maxHeight: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: 0,
        border: "1px solid #ff5252",
        boxSizing: "border-box",
      }}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
        <DialogTitle
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            backgroundColor: "background.paper",
            flexShrink: 0,
          }}
        >
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{
              color: "error.main",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: { xs: "1rem", sm: "1.25rem" },
              lineHeight: 1.3,
            }}
          >
            [ ! ] Блокування користувача
          </Typography>
          {onClose && (
            <IconButton onClick={onClose} size="small" sx={{ color: "text.secondary", mr: -0.5, p: 0.5 }}>
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>

        <Box sx={{ p: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 2, flex: 1, minHeight: 0, overflowY: "auto" }}>
          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-word" }}>
            Ви збираєтесь заблокувати акаунт <b>{userName}</b>. Користувач втратить доступ до системи та не зможе увійти.
          </Typography>

          <TextField
            label="Причина блокування"
            placeholder="Вкажіть причину бану (необов'язково)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            multiline
            minRows={3}
            fullWidth
            disabled={isSubmitting}
            variant="filled"
            InputProps={{
              disableUnderline: true,
            }}
          />

          <Box sx={{ display: "flex", flexDirection: { xs: "column-reverse", sm: "row" }, gap: { xs: 1.5, sm: 2 }, mt: 1 }}>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              onClick={onClose}
              disabled={isSubmitting}
            >
              Скасувати
            </Button>
            <Button
              type="submit"
              variant="outlined"
              color="error"
              fullWidth
              disabled={isSubmitting}
            >
              {isSubmitting ? <LoadingIndicator minHeight={24} /> : "Заблокувати"}
            </Button>
          </Box>
        </Box>
      </form>
    </Paper>
  );
};

export default BanUserForm;
