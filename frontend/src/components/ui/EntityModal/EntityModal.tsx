import React from "react";
import { Dialog, DialogContent } from "@mui/material";

type EntityModalProps = {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | false;
};

const EntityModal: React.FC<EntityModalProps> = ({ open, onClose, children, maxWidth = "xl" }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={maxWidth}
            fullWidth
            PaperProps={{
                sx: {
                    backgroundColor: "transparent",
                    boxShadow: "none",
                    width: "auto",
                    maxWidth: { xs: "calc(100vw - 32px)", sm: "none" },
                    maxHeight: { xs: "calc(100dvh - 32px)", sm: "calc(100vh - 64px)" },
                    m: { xs: 2, sm: 4 },
                    borderRadius: 0,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                }
            }}
            sx={{
                "& .MuiBackdrop-root": {
                    backgroundColor: "#000000cc", // Dark flat background without blur
                },
                "& .MuiDialog-container": {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <DialogContent
                sx={{
                    padding: 0,
                    backgroundColor: "transparent",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    minHeight: 0,
                    width: "100%",
                }}
            >
                {children}
            </DialogContent>
        </Dialog>
    );
};

export default EntityModal;
