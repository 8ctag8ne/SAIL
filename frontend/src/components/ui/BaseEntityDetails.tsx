import React from "react";
import { Card, CardContent, CardMedia, Box } from "@mui/material";

export interface BaseEntityDetailsProps {
  imageUrl?: string | null;
  imagePlaceholderIcon: React.ReactNode;
  imageWidth?: number | string;
  imageHeight?: number | string;
  imageAspectRatio?: string;
  leftColumnAppend?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  tags?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
}

const BaseEntityDetails: React.FC<BaseEntityDetailsProps> = ({
  imageUrl,
  imagePlaceholderIcon,
  imageWidth = 250,
  imageHeight,
  imageAspectRatio,
  leftColumnAppend,
  title,
  subtitle,
  description,
  tags,
  actions,
  footer,
}) => {
  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        p: { xs: 2, sm: 2.5, md: 3 },
        m: { xs: "10px auto", sm: "20px auto" },
        width: "100%",
      }}
    >
      {/* DESKTOP LAYOUT (md+) */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "row",
          gap: 3,
          width: "100%",
          alignItems: "flex-start",
        }}
      >
        {/* Left Column on desktop */}
        <Box
          sx={{
            width: imageWidth,
            minWidth: imageWidth,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {imageUrl ? (
            <CardMedia
              component="img"
              sx={{
                width: "100%",
                height: imageHeight ?? "auto",
                aspectRatio: imageHeight ? undefined : (imageAspectRatio || "1/1.414"),
                objectFit: "cover",
                borderRadius: 0,
                border: "1px solid #2d2f33",
              }}
              image={imageUrl}
              alt="Entity image"
            />
          ) : (
            <Box
              sx={{
                width: "100%",
                height: imageHeight ?? "auto",
                aspectRatio: imageHeight ? undefined : (imageAspectRatio || "1/1.414"),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 0,
                border: "1px dashed rgba(255, 255, 255, 0.1)",
                backgroundColor: "rgba(255, 255, 255, 0.02)",
              }}
            >
              {imagePlaceholderIcon}
            </Box>
          )}

          {leftColumnAppend && (
            <Box sx={{ mt: 2, width: "100%" }}>
              {leftColumnAppend}
            </Box>
          )}
        </Box>

        {/* Right Info on desktop */}
        <CardContent
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            p: 0,
            "&:last-child": { pb: 0 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 1,
              width: "100%",
              mb: 1,
            }}
          >
            <Box sx={{ flex: "1 1 auto", minWidth: 0 }}>{title}</Box>
            {actions && <Box sx={{ flex: "0 0 auto" }}>{actions}</Box>}
          </Box>

          {subtitle && (
            <Box sx={{ width: "100%", maxWidth: "100%", mb: 0.75 }}>
              {subtitle}
            </Box>
          )}

          {tags && (
            <Box sx={{ width: "100%", maxWidth: "100%", mb: 1 }}>
              {tags}
            </Box>
          )}

          {description && (
            <Box sx={{ width: "100%", maxWidth: "100%", mb: 1 }}>
              {description}
            </Box>
          )}

          {footer && (
            <Box sx={{ display: "flex", width: "100%", justifyContent: "flex-start", alignItems: "center", mt: 0.5 }}>
              {footer}
            </Box>
          )}
        </CardContent>
      </Box>

      {/* MOBILE / TABLET LAYOUT (xs, sm) */}
      <Box
        sx={{
          display: { xs: "flex", md: "none" },
          flexDirection: "column",
          width: "100%",
        }}
      >
        {/* 1. Centered Cover */}
        <Box
          sx={{
            width: typeof imageWidth === 'number' ? imageWidth : 300,
            maxWidth: "100%",
            mx: "auto",
            mb: 1.5,
            flexShrink: 0,
          }}
        >
          {imageUrl ? (
            <CardMedia
              component="img"
              sx={{
                width: "100%",
                height: imageHeight ?? "auto",
                aspectRatio: imageHeight ? undefined : (imageAspectRatio || "1/1.414"),
                objectFit: "cover",
                borderRadius: 0,
                border: "1px solid #2d2f33",
              }}
              image={imageUrl}
              alt="Entity image"
            />
          ) : (
            <Box
              sx={{
                width: "100%",
                height: imageHeight ?? "auto",
                aspectRatio: imageHeight ? undefined : (imageAspectRatio || "1/1.414"),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 0,
                border: "1px dashed rgba(255, 255, 255, 0.1)",
                backgroundColor: "rgba(255, 255, 255, 0.02)",
                py: 4,
              }}
            >
              {imagePlaceholderIcon}
            </Box>
          )}
        </Box>

        {/* 2. Action Toolbar under cover */}
        {leftColumnAppend && (
          <Box sx={{ width: "100%", maxWidth: typeof imageWidth === 'number' ? imageWidth : 300, mx: "auto", mb: 2 }}>
            {leftColumnAppend}
          </Box>
        )}

        {/* 3. Title */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 1,
            width: "100%",
            mb: 1,
          }}
        >
          <Box sx={{ flex: "1 1 auto", minWidth: 0 }}>{title}</Box>
          {actions && !leftColumnAppend && <Box sx={{ flex: "0 0 auto" }}>{actions}</Box>}
        </Box>

        {/* 4. Subtitle (Authors) */}
        {subtitle && (
          <Box sx={{ width: "100%", maxWidth: "100%", mb: 0.75 }}>
            {subtitle}
          </Box>
        )}

        {/* 5. Tags (100% full width) */}
        {tags && (
          <Box sx={{ width: "100%", maxWidth: "100%", mb: 1 }}>
            {tags}
          </Box>
        )}

        {/* 6. Description (100% full width) */}
        {description && (
          <Box sx={{ width: "100%", maxWidth: "100%", mb: 0.75 }}>
            {description}
          </Box>
        )}

        {/* 7. Footer (if any) */}
        {footer && (
          <Box sx={{ display: "flex", width: "100%", justifyContent: "flex-start", alignItems: "center", mt: 0.5 }}>
            {footer}
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default BaseEntityDetails;
