import React, { useState } from 'react';
import { Box, Chip, TextField, Autocomplete } from '@mui/material';

export interface EntityChipSelectProps<T> {
    label: string;
    availableItems: T[];
    selectedItems: T[];
    onChange: (items: T[]) => void;
    placeholder?: string;
}

export function EntityChipSelect<T extends { id: number | string; name?: string; title?: string }>(
    props: EntityChipSelectProps<T>
) {
    const { label, availableItems, selectedItems, onChange, placeholder } = props;
    const [inputValue, setInputValue] = useState('');

    const handleRemove = (idToRemove: string | number) => {
        onChange(selectedItems.filter((item) => item.id !== idToRemove));
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Autocomplete
                multiple
                options={availableItems}
                value={selectedItems}
                onChange={(event, newValue) => {
                    onChange(newValue);
                }}
                inputValue={inputValue}
                onInputChange={(event, newInputValue, reason) => {
                    if (reason !== 'reset') {
                        setInputValue(newInputValue);
                    } else {
                        setInputValue('');
                    }
                }}
                getOptionLabel={(option) => option.title || option.name || String(option.id)}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderTags={() => null}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={label}
                        placeholder={placeholder}
                        fullWidth
                        size="small"
                    />
                )}
            />
            {selectedItems.length > 0 && (
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                        mt: 1,
                        width: '100%',
                    }}
                >
                    {selectedItems.map((item) => (
                        <Chip
                            key={item.id}
                            label={item.title || item.name}
                            color="primary"
                            onDelete={() => handleRemove(item.id)}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
}

export default EntityChipSelect;
