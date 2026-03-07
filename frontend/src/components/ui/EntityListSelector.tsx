import React from 'react';
import { Box, TextField, Paper, Checkbox, Typography, Button } from '@mui/material';
import LoadingIndicator from './LoadingIndicator';

export type EntityListSelectorProps<T> = {
    items: T[];
    loading?: boolean;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    onSearchSubmit?: (e: React.FormEvent) => void;
    searchPlaceholder?: string;
    renderItem: (item: T) => React.ReactNode;
    isItemSelected: (item: T) => boolean;
    isItemDisabled?: (item: T) => boolean;
    onToggleItem: (item: T) => void;
    footerAction?: React.ReactNode;
    keyExtractor: (item: T) => string | number;
};

export const EntityListSelector = <T,>({
    items,
    loading = false,
    searchQuery,
    onSearchChange,
    onSearchSubmit,
    searchPlaceholder = "Пошук...",
    renderItem,
    isItemSelected,
    isItemDisabled,
    onToggleItem,
    footerAction,
    keyExtractor,
}: EntityListSelectorProps<T>) => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {(onSearchChange !== undefined || onSearchSubmit !== undefined) && (
                <Box
                    component={onSearchSubmit ? "form" : "div"}
                    onSubmit={onSearchSubmit}
                    sx={{ display: 'flex', gap: 1, mb: 1 }}
                >
                    <TextField
                        value={searchQuery || ""}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                        placeholder={searchPlaceholder}
                        size="small"
                        fullWidth
                    />
                    {onSearchSubmit && (
                        <Button type="submit" variant="contained">
                            Пошук
                        </Button>
                    )}
                </Box>
            )}

            <Box
                sx={{
                    height: 250,
                    overflowY: "auto",
                    p: 1,
                    border: "1px solid #eee",
                    borderRadius: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    position: 'relative',
                    boxSizing: 'border-box'
                }}
            >
                {loading ? (
                    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LoadingIndicator />
                    </Box>
                ) : items.length === 0 ? (
                    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography color="text.secondary">Нічого не знайдено</Typography>
                    </Box>
                ) : (
                    <>
                        {items.map((item) => {
                            const selected = isItemSelected(item);
                            const disabled = isItemDisabled ? isItemDisabled(item) : false;
                            return (
                                <Paper
                                    key={keyExtractor(item)}
                                    elevation={0}
                                    onClick={() => !disabled && onToggleItem(item)}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        p: 1,
                                        border: "1px solid #eee",
                                        cursor: disabled ? "not-allowed" : "pointer",
                                        opacity: disabled ? 0.5 : 1,
                                        background: selected ? "#e3f2fd" : "#fff",
                                        '&:hover': {
                                            background: selected ? "#e3f2fd" : disabled ? "#fff" : "#f5f5f5"
                                        }
                                    }}
                                >
                                    <Checkbox
                                        checked={selected}
                                        disabled={disabled}
                                        sx={{ mr: 1, p: 0 }}
                                    />
                                    {renderItem(item)}
                                </Paper>
                            );
                        })}
                        {footerAction && (
                            <Box sx={{ mt: 'auto', pt: 1 }}>
                                {footerAction}
                            </Box>
                        )}
                    </>
                )}
            </Box>
        </Box>
    );
};

export default EntityListSelector;
