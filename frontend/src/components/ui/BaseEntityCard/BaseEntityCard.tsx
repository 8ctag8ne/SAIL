import React from "react";
import { Card, CardContent, CardMedia, Typography, Box } from "@mui/material";

export interface BaseEntityCardProps {
  className?: string; // Allow global CSS classes
  minHeight?: number | string;
  imageUrl?: string | null;
  imagePlaceholderIcon: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  tags?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
}

const MAX_DESCRIPTION_HEIGHT = 120;

const BaseEntityCard: React.FC<BaseEntityCardProps> = ({
  className,
  minHeight,
  imageUrl,
  imagePlaceholderIcon,
  title,
  subtitle,
  description,
  tags,
  actions,
  footer,
  onClick,
}) => {
  const isDescriptionString = typeof description === "string";
  const showGradient = isDescriptionString
    ? (description as string).split("\n").length > 6
    : true;

  const resolvedClassName = [className, onClick ? "MuiCard-interactive" : ""].filter(Boolean).join(" ");

  return (
    <Card
      className={resolvedClassName}
      onClick={onClick}
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        minHeight: minHeight || { xs: "auto", sm: 220 },
        padding: 2,
        marginY: 2,
        marginX: "auto",
        position: "relative",
        overflow: "hidden",
        ...(onClick ? { cursor: "pointer" } : {}),
      }}
    >
      {imageUrl ? (
        <CardMedia
          component="img"
          image={imageUrl}
          alt="Entity Image"
          sx={{
            width: { xs: "100%", sm: 150 },
            height: { xs: 200, sm: "auto" },
            objectFit: "cover",
            flexShrink: 0,
            marginRight: { xs: 0, sm: 2 },
            marginBottom: { xs: 2, sm: 0 },
          }}
        />
      ) : (
        <Box
          sx={{
            width: { xs: "100%", sm: 150 },
            height: { xs: 200, sm: "auto" },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginRight: { xs: 0, sm: 2 },
            marginBottom: { xs: 2, sm: 0 },
          }}
        >
          {imagePlaceholderIcon}
        </Box>
      )}

      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          p: 2,
          overflow: "hidden",
          "&:last-child": { pb: 2 } // Keep padding standard visually despite absolute bounds removal
        }}
      >
        {/* Top Row (Title & Actions) */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 1 }}>
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{
              flexGrow: 1,
              minWidth: 0, // Fix flex truncation issues
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </Typography>

          {actions && (
            <Box sx={{ flexShrink: 0, display: "flex", gap: 1 }}>
              {actions}
            </Box>
          )}
        </Box>

        {/* Middle Section (Subtitle & Description) */}
        {subtitle && <Box sx={{ mb: 1 }}>{subtitle}</Box>}

        {description && (
          <Box
            sx={{
              maxHeight: MAX_DESCRIPTION_HEIGHT,
              overflow: "hidden",
              position: "relative",
              maxWidth: "100%",
              mb: 1,
            }}
          >
            <Typography
              variant="body1"
              color="text.secondary"
              component="div"
              sx={{
                whiteSpace: "pre-line",
                wordBreak: "break-word",
                m: 0,
              }}
            >
              {description}
            </Typography>
            <Box
              sx={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: 32,
                background: (theme) => `linear-gradient(to bottom, transparent 0%, ${theme.palette.background.paper} 100%)`,
                pointerEvents: "none",
                display: showGradient ? "block" : "none",
              }}
            />
          </Box>
        )}

        {/* Spacer (Crucial for standardized height) */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Bottom Row (Tags & Footer) */}
        {(tags || footer) && (
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 2, mt: 2 }}>
            <Box sx={{ flexGrow: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
              {tags}
            </Box>

            {footer && (
              <Box sx={{ flexShrink: 0 }}>
                {footer}
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default BaseEntityCard;