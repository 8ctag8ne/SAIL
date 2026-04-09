import React from "react";
import { Card, CardContent, CardMedia, Box } from "@mui/material";

export interface BaseEntityDetailsProps {
  imageUrl?: string | null;
  imagePlaceholderIcon: React.ReactNode;
  imageWidth?: number | string;
  imageHeight?: number | string;
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
  imageWidth = 200,
  imageHeight = 200,
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
        flexDirection: { xs: "column", md: "row" },
        p: 2,
        m: "20px auto",
        width: "100%",
      }}
    >
      <Box
        sx={{
          width: { xs: "100%", md: imageWidth },
          flexShrink: 0,
          mr: { xs: 0, md: 3 },
          mb: { xs: 2, md: 0 },
        }}
      >
        {imageUrl ? (
          <CardMedia
            component="img"
            sx={{
              width: "100%",
              height: imageHeight,
              objectFit: "cover",
              borderRadius: 1,
            }}
            image={imageUrl}
            alt="Entity image"
          />
        ) : (
          <Box
            sx={{
              width: "100%",
              height: imageHeight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#eee",
              borderRadius: 1,
            }}
          >
            {imagePlaceholderIcon}
          </Box>
        )}
        {leftColumnAppend}
      </Box>

      <CardContent
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          p: 0,
          pb: "0 !important",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 2,
            width: "100%",
          }}
        >
          <Box sx={{ flex: "1 1 auto", minWidth: 0 }}>{title}</Box>
          {actions && <Box sx={{ flex: "0 0 auto" }}>{actions}</Box>}
        </Box>

        {subtitle && (
          <Box sx={{ width: "100%", maxWidth: "100%" }}>
            {subtitle}
          </Box>
        )}
        {tags && (
          <Box sx={{ width: "100%", maxWidth: "100%", mt: 1, mb: 1 }}>
            {tags}
          </Box>
        )}
        {description && (
          <Box sx={{ width: "100%", maxWidth: "100%" }}>
            {description}
          </Box>
        )}

        <Box sx={{ flexGrow: 1 }} />

        {footer && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "flex-end",
              mt: 2,
            }}
          >
            <Box>{footer}</Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default BaseEntityDetails;
