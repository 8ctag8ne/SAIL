import { Dialog, DialogTitle, DialogActions, Button } from "@mui/material";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmDialog = ({ open, title, onConfirm, onCancel }: ConfirmDialogProps) => (
    <Dialog open={open} onClose={onCancel} onClick={(e) => e.stopPropagation()}>
        <DialogTitle>{title}</DialogTitle>
        <DialogActions>
            <Button onClick={onCancel} color="secondary">Скасувати</Button>
            <Button onClick={onConfirm} color="error">Підтвердити</Button>
        </DialogActions>
    </Dialog>
);

export default ConfirmDialog;
