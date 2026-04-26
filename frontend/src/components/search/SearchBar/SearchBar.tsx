import React, { useState, ReactNode, useEffect } from "react";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import { Box, TextField, Button, IconButton } from "@mui/material";

type SearchBarProps = {
  placeholder?: string;
  onSearch: (query: string) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
  icon?: ReactNode;
  onFilterToggle?: () => void;
  isFilterActive?: boolean;
};

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Пошук...",
  onSearch,
  value = "",
  icon,
  onFilterToggle,
  isFilterActive = false,
  ...props
}) => {
  const [query, setQuery] = useState<string>(value);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (props.onChange) {
      props.onChange(e);
    }
  };

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const handleSearchClick = () => {
    onSearch(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch(query);
    }
  };

  return (
    <Box sx={{ display: 'flex', width: '100%' }} className="tour-search-bar">
      <TextField
        variant="outlined"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        fullWidth
        InputProps={{
          endAdornment: onFilterToggle && (
            <IconButton
              className="tour-tag-filter"
              onClick={onFilterToggle}
              sx={{
                color: isFilterActive ? 'primary.main' : 'text.secondary',
                borderRadius: 0,
              }}
              title="Розширений пошук (фільтри)"
            >
              <FilterAltIcon />
            </IconButton>
          ),
          sx: {
            borderRadius: 0,
            // borderRight: 'none',
            '& fieldset': {
              // borderRight: 'none',
              borderRadius: 0,
            },
            // '&:hover fieldset': {
            //   borderRight: 'none !important',
            // },
            // '&.Mui-focused fieldset': {
            //   borderRight: 'none !important',
            // }
          }
        }}
      />
      <Button
        variant="outlined"
        onClick={handleSearchClick}
        sx={{
          borderRadius: 0,
          borderLeft: '1px solid',
          borderColor: 'divider',
          minWidth: '64px',
          padding: 0,
          '&:hover': {
            borderLeft: '1px solid',
          }
        }}
      >
        {icon || <SearchIcon />}
      </Button>
    </Box>
  );
};

export default SearchBar;