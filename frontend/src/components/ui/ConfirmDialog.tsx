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
}

const ConfirmDialog = ({
    open,
    title,
    onConfirm,
    onCancel,
    confirmColor = "error",
    confirmText = "Підтвердити"
}: ConfirmDialogProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const handleConfirm = async (e: React.MouseEvent) => {
        setIsSubmitting(true);
        try {
            await onConfirm(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={() => !isSubmitting && onCancel()}
            fullWidth
            maxWidth="xs"
        >
            <DialogTitle sx={{ px: 3, py: 2 }}>
                {title}
            </DialogTitle>

            <DialogActions
                sx={{
                    px: 3,
                    pb: 3,
                    pt: 1,
                    display: "flex",
                    gap: 2,
                    flexDirection: isMobile ? "column" : "row",
                    justifyContent: isMobile ? "stretch" : "flex-end"
                }}
            >
                <Button
                    onClick={onCancel}
                    color="secondary"
                    disabled={isSubmitting}
                    fullWidth={isMobile}
                    sx={{
                        flex: isMobile ? undefined : 1
                    }}
                >
                    Скасувати
                </Button>

                <Button
                    onClick={handleConfirm}
                    color={confirmColor}
                    disabled={isSubmitting}
                    fullWidth={isMobile}
                    sx={{
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