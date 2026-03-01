import { useState } from "react";
import { Dialog, DialogTitle, DialogActions, Button } from "@mui/material";
import LoadingIndicator from "./LoadingIndicator";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmDialog = ({ open, title, onConfirm, onCancel }: ConfirmDialogProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            await onConfirm();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={() => !isSubmitting && onCancel()} onClick={(e) => e.stopPropagation()}>
            <DialogTitle>{title}</DialogTitle>
            <DialogActions>
                <Button onClick={onCancel} color="secondary" disabled={isSubmitting}>Скасувати</Button>
                <Button onClick={handleConfirm} color="error" disabled={isSubmitting}>
                    {isSubmitting ? <LoadingIndicator minHeight={24} /> : "Підтвердити"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
