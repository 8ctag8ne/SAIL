import React from "react";
import { Card, CardContent, CardMedia, Typography, Box } from "@mui/material";

export interface BaseEntityCardProps {
  className?: string; // Allow global CSS classes
  minHeight?: number | string;
  imageUrl?: string | null;
  imageAspectRatio?: string;
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
  imageAspectRatio,
  imagePlaceholderIcon,
  title,
  subtitle,
  description,
  tags,
  actions,
  footer,
  onClick,
}) => {
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
        overflow: "ellipsis",
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
            height: "auto",
            aspectRatio: imageAspectRatio || "2/3",
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
            height: "auto",
            aspectRatio: imageAspectRatio || "2/3",
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
          minWidth: 0,
          p: 2,
          overflow: "hidden", // Replaced invalid overflow: "ellipsis"
          "&:last-child": { pb: 2 } // Keep padding standard visually despite absolute bounds removal
        }}
      >
        {/* Top Row (Title & Actions) */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 1, width: "100%" }}>
          <Box sx={{ flex: "1 1 auto", minWidth: 0 }}>
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{
                width: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </Typography>
          </Box>

          {actions && (
            <Box sx={{ flex: "0 0 auto", display: "flex", gap: 1 }}>
              {actions}
            </Box>
          )}
        </Box>

        {/* Middle Section (Subtitle & Description) */}
        {subtitle && <Box sx={{ mb: 1 }}>{subtitle}</Box>}

        {tags && (
          <Box sx={{ mb: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
            {tags}
          </Box>
        )}

        {description && (
          <Box sx={{ mb: 1, width: "100%", maxWidth: "100%" }}>
            <Typography
              variant="body1"
              color="text.secondary"
              component="div"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                whiteSpace: "pre-line",
                wordBreak: "break-word",
                m: 0,
              }}
            >
              {description}
            </Typography>
          </Box>
        )}

        {/* Spacer (Crucial for standardized height) */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Bottom Row (Footer) */}
        {footer && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-end", mt: 2 }}>
            <Box sx={{ flexShrink: 0 }}>
              {footer}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default BaseEntityCard;