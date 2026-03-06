import React from 'react';
import { Autocomplete, TextField, Chip, createFilterOptions, FilterOptionsState } from '@mui/material';

export interface Identifiable {
    id: string | number;
    title?: string;
    name?: string;
}

export interface UniversalCreatableSelectorProps<T extends Identifiable> {
    label: string;
    options: T[];
    selectedExisting: T[];
    selectedNew: string[];
    onExistingChange: (items: T[]) => void;
    onNewChange: (names: string[]) => void;
    isLoading?: boolean;
}

type AutocompleteOption<T> = T | { inputValue: string; title: string };

const filter = createFilterOptions<AutocompleteOption<any>>();

export default function UniversalCreatableSelector<T extends Identifiable>({
    label,
    options,
    selectedExisting,
    selectedNew,
    onExistingChange,
    onNewChange,
    isLoading = false,
}: UniversalCreatableSelectorProps<T>) {

    const getOptionLabel = (option: AutocompleteOption<T> | string): string => {
        if (typeof option === 'string') {
            return option;
        }
        if ('inputValue' in option && option.inputValue) {
            return option.inputValue;
        }
        return ((option as T).title || (option as T).name || '').toString();
    };

    const allSelectedItems: (AutocompleteOption<T> | string)[] = [
        ...selectedExisting,
        ...selectedNew.map((name) => ({ inputValue: name, title: name })),
    ];

    const handleOnChange = (event: React.SyntheticEvent, newValue: (AutocompleteOption<T> | string)[]) => {
        const newExisting: T[] = [];
        const newNew: string[] = [];

        newValue.forEach((item) => {
            if (typeof item === 'string') {
                const matchingExisting = options.find((opt) =>
                    (opt.title || opt.name || '').toLowerCase() === item.toLowerCase()
                );
                if (matchingExisting) {
                    if (!newExisting.some((ex) => ex.id === matchingExisting.id)) {
                        newExisting.push(matchingExisting);
                    }
                } else {
                    newNew.push(item);
                }
            } else if ('inputValue' in item && item.inputValue) {
                const matchingExisting = options.find((opt) =>
                    (opt.title || opt.name || '').toLowerCase() === item.inputValue.toLowerCase()
                );
                if (matchingExisting) {
                    if (!newExisting.some((ex) => ex.id === matchingExisting.id)) {
                        newExisting.push(matchingExisting);
                    }
                } else {
                    newNew.push(item.inputValue);
                }
            } else {
                newExisting.push(item as T);
            }
        });

        onExistingChange(newExisting);
        onNewChange(Array.from(new Set(newNew)));
    };

    return (
        <Autocomplete
            multiple
            freeSolo
            fullWidth
            options={options as AutocompleteOption<T>[]}
            value={allSelectedItems}
            loading={isLoading}
            onChange={handleOnChange}
            sx={{ width: '100%', '& .MuiInputBase-root': { maxHeight: 200, overflowY: 'auto', flexWrap: 'wrap' } }}
            filterOptions={(opts, params) => {
                const filtered = filter(opts, params) as AutocompleteOption<T>[];

                const { inputValue } = params;
                const isExisting = options.some((opt) =>
                    inputValue.trim().toLowerCase() === ((opt as T).title || (opt as T).name || '').toLowerCase()
                );

                if (inputValue !== '' && !isExisting) {
                    filtered.push({
                        inputValue: inputValue,
                        title: `Створити "${inputValue}"`,
                    });
                }

                return filtered.filter(option => {
                    if (typeof option === 'string') return true;
                    if ('inputValue' in option) return true;
                    return !selectedExisting.some(ex => ex.id === (option as T).id);
                });
            }}
            getOptionLabel={getOptionLabel}
            isOptionEqualToValue={(option, value) => {
                if (typeof option === 'string' || typeof value === 'string') {
                    return typeof option === 'string' && typeof value === 'string' && option === value;
                }
                if ('inputValue' in option || 'inputValue' in value) {
                    return 'inputValue' in option && 'inputValue' in value && option.inputValue === value.inputValue;
                }
                return (option as T).id === (value as T).id;
            }}
            renderOption={(props, option) => {
                // Workaround: React 18 / Material UI types might complain if props don't map to a React.HTMLAttributes correctly,
                // but we just pass them to the li.
                return (
                    <li {...props} key={typeof option === 'string' ? option : ('inputValue' in option ? option.inputValue : (option as T).id)}>
                        {typeof option === 'string' ? option : ('inputValue' in option ? option.title : ((option as T).title || (option as T).name))}
                    </li>
                );
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    margin="normal"
                    fullWidth
                // We can remove the implicit standard variant or leave it to standard props (usually margin="normal" implies standard or matching parent theme)
                />
            )}
            renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => {
                    const isNew = typeof option === 'string' || ('inputValue' in option && !!option.inputValue);
                    const label = getOptionLabel(option);

                    return (
                        <Chip
                            {...getTagProps({ index })}
                            key={index}
                            label={label}
                            variant={isNew ? "outlined" : "filled"}
                            color={isNew ? "default" : "primary"}
                        />
                    );
                })
            }
            ListboxProps={{
                style: { maxHeight: 200 }
            }}
        />
    );
}
