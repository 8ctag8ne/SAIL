import { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogActions,
    Button,
    useTheme,
    useMediaQuery
} from "@mui/material";
import LoadingIndicator from "./LoadingIndicator";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    onConfirm: (e: React.MouseEvent) => Promise<void> | void;
    onCancel: () => void;
    confirmColor?: "inherit" | "primary" | "secondary" | "success" | "error" | "info" | "warning";
    confirmText?: string;
    className?: string;
}

const ConfirmDialog = ({
    open,
    title,
    onConfirm,
    onCancel,
    confirmColor = "error",
    confirmText = "Підтвердити",
    className
}: ConfirmDialogProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const handleConfirm = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onConfirm(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog
            className={className}
            open={open}
            onClose={() => !isSubmitting && onCancel()}
            onClick={(e) => e.stopPropagation()}
            fullWidth
            maxWidth="xs"
            PaperProps={{
                sx: {
                    m: { xs: 2, sm: 4 },
                    maxWidth: { xs: "calc(100vw - 32px)", sm: 444 },
                    borderRadius: 0,
                    boxSizing: "border-box",
                }
            }}
        >
            <DialogTitle sx={{ px: { xs: 2, sm: 3 }, py: 2, wordBreak: "break-word" }}>
                {title}
            </DialogTitle>

            <DialogActions
                sx={{
                    px: { xs: 2, sm: 3 },
                    pb: { xs: 2, sm: 3 },
                    pt: 1,
                    display: "flex",
                    gap: { xs: 1.5, sm: 2 },
                    flexDirection: isMobile ? "column-reverse" : "row",
                    justifyContent: isMobile ? "stretch" : "flex-end"
                }}
            >
                <Button
                    onClick={(e) => {
                        e.stopPropagation();
                        onCancel();
                    }}
                    variant="outlined"
                    color="secondary"
                    disabled={isSubmitting}
                    fullWidth={isMobile}
                    sx={{
                        m: "0 !important",
                        flex: isMobile ? undefined : 1
                    }}
                >
                    Скасувати
                </Button>

                <Button
                    onClick={handleConfirm}
                    variant="outlined"
                    color={confirmColor}
                    disabled={isSubmitting}
                    fullWidth={isMobile}
                    sx={{
                        m: "0 !important",
                        flex: isMobile ? undefined : 1
                    }}
                >
                    {isSubmitting ? (
                        <LoadingIndicator minHeight={24} />
                    ) : (
                        confirmText
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;