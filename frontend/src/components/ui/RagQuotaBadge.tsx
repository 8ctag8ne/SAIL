import React from "react";
import { Box, Tooltip, Typography, useTheme } from "@mui/material";
import { RagQuota, formatTimeUntilReset } from "../../api/AiApi";

interface RagQuotaBadgeProps {
  quota: RagQuota | null;
  loading?: boolean;
}

const RagQuotaBadge: React.FC<RagQuotaBadgeProps> = ({ quota, loading = false }) => {
  const theme = useTheme();

  if (!quota && loading) {
    return (
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          px: 1.25,
          py: 0.4,
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.secondary,
          fontFamily: theme.typography.fontFamily,
          fontSize: "0.75rem",
          letterSpacing: "0.02em",
          userSelect: "none",
        }}
      >
        <Typography variant="caption" sx={{ fontFamily: "inherit", color: "inherit", fontSize: "inherit" }}>
          Квота: ...
        </Typography>
      </Box>
    );
  }

  if (!quota) return null;

  const isExhausted = !quota.isUnlimited && quota.remaining === 0;

  const labelText = quota.isUnlimited
    ? "Квота: Безліміт"
    : `Квота: ${quota.remaining}/${quota.dailyLimit}`;

  const tooltipTitle = quota.isUnlimited
    ? "Необмежений доступ до AI-пошуку для адміністратора"
    : isExhausted
    ? `Денний ліміт вичерпано. Скидання через ${formatTimeUntilReset(quota.secondsUntilReset)}`
    : `Залишилось ${quota.remaining} з ${quota.dailyLimit} запитів на добу. Скидання через ${formatTimeUntilReset(
        quota.secondsUntilReset
      )}`;

  return (
    <Tooltip title={tooltipTitle} arrow placement="top">
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          px: 1.25,
          py: 0.4,
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          fontFamily: theme.typography.fontFamily,
          fontSize: "0.75rem",
          fontWeight: 500,
          letterSpacing: "0.02em",
          cursor: "default",
          userSelect: "none",
          transition: "border-color 0.2s ease, opacity 0.2s ease",
          "&:hover": {
            borderColor: theme.palette.text.primary,
          },
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontFamily: "inherit",
            color: theme.palette.text.primary,
            fontSize: "inherit",
            fontWeight: "inherit",
          }}
        >
          {labelText}
        </Typography>
      </Box>
    </Tooltip>
  );
};

export default RagQuotaBadge;
