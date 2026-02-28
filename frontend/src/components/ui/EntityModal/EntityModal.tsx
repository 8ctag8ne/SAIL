import React from "react";
import { Dialog, DialogContent, Backdrop } from "@mui/material";

type EntityModalProps = {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
};

const EntityModal: React.FC<EntityModalProps> = ({ open, onClose, children }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    backgroundColor: "transparent",
                    boxShadow: "none",
                    width: "auto",      // Дозволяє контенту самому визначати ширину
                    maxWidth: "none",   // Знімає стандартне обмеження MUI по ширині
                }
            }}
            sx={{
                "& .MuiBackdrop-root": {
                    backgroundColor: "rgba(255, 255, 255, 0.8)", // Напівпрозорий білий фон
                    backdropFilter: "blur(4px)", // Легке розмиття для приглушення неактивної сторінки
                },
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <DialogContent
                sx={{
                    p: 0,
                    backgroundColor: "transparent",
                    overflowY: "auto",
                    overflowX: "hidden"
                }}
            >
                {children}
            </DialogContent>
        </Dialog>
    );
};

export default EntityModal;
