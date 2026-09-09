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
        flexDirection: "row", // 2 колонки на всіх екранах (фото ліворуч, інфо праворуч)
        minHeight: minHeight || { xs: 110, sm: 120, md: 190 },
        padding: { xs: 1, sm: 1.25, md: 2 },
        marginY: { xs: 1, sm: 1.25, md: 2 },
        marginX: "auto",
        position: "relative",
        overflow: "hidden",
        width: "100%",
        ...(onClick ? { cursor: "pointer" } : {}),
      }}
    >
      {imageUrl ? (
        <CardMedia
          component="img"
          image={imageUrl}
          alt="Entity Image"
          sx={{
            width: { xs: 80, sm: 95, md: 140 },
            minWidth: { xs: 80, sm: 95, md: 140 },
            height: "auto",
            aspectRatio: imageAspectRatio || "1/1.414",
            objectFit: "cover",
            flexShrink: 0,
            alignSelf: "center", // Вертикальне центрування обкладинки
            marginRight: { xs: 1.25, sm: 1.5, md: 2 },
            marginBottom: 0,
          }}
        />
      ) : (
        <Box
          sx={{
            width: { xs: 80, sm: 95, md: 140 },
            minWidth: { xs: 80, sm: 95, md: 140 },
            height: "auto",
            aspectRatio: imageAspectRatio || "1/1.414",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            alignSelf: "center", // Вертикальне центрування плейсхолдера
            marginRight: { xs: 1.25, sm: 1.5, md: 2 },
            marginBottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.02)",
            border: "1px dashed rgba(255, 255, 255, 0.1)",
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
          p: { xs: 0.5, sm: 0.75, md: 1.5 },
          overflow: "hidden",
          "&:last-child": { pb: { xs: 0.5, sm: 0.75, md: 1.5 } }
        }}
      >
        {/* Top Row (Title & Actions) */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 0.5, width: "100%" }}>
          <Box sx={{ flex: "1 1 auto", minWidth: 0 }}>
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{
                fontSize: { xs: "0.92rem", sm: "1.02rem", md: "1.25rem" },
                lineHeight: 1.25,
                width: "100%",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                wordBreak: "break-word",
              }}
            >
              {title}
            </Typography>
          </Box>

          {actions && (
            <Box sx={{ flex: "0 0 auto", display: "flex", gap: 0.5 }}>
              {actions}
            </Box>
          )}
        </Box>

        {/* Middle Section (Subtitle & Description) */}
        {subtitle && (
          <Box sx={{ mb: 0.5, fontSize: { xs: "0.8rem", sm: "0.85rem", md: "0.9rem" } }}>
            {subtitle}
          </Box>
        )}

        {description && (
          <Box sx={{ mb: 0.5, width: "100%", maxWidth: "100%", display: { xs: "none", md: "block" } }}>
            <Typography
              variant="body2"
              color="text.secondary"
              component="div"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: { md: 2, lg: 3 },
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                whiteSpace: "pre-line",
                wordBreak: "break-word",
                m: 0,
                fontSize: { md: "0.82rem", lg: "0.875rem" }
              }}
            >
              {description}
            </Typography>
          </Box>
        )}

        {tags && (
          <Box sx={{ mb: 0.5, display: "flex", flexWrap: "wrap", gap: { xs: 0.5, sm: 0.75 } }}>
            {tags}
          </Box>
        )}

        {/* Spacer - pushes footer strictly to the bottom */}
        <Box sx={{ flexGrow: 1, minHeight: 4 }} />

        {/* Bottom Row (Footer strictly at the bottom) */}
        {footer && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-end", mt: "auto", pt: 0.5, width: "100%" }}>
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