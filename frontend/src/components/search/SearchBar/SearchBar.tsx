import React, { useState, useEffect, ReactNode } from "react";
import "./SearchBar.css";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltIcon from "@mui/icons-material/FilterAlt";

type SearchBarProps = {
  placeholder?: string;
  onSearch: (query: string) => void;
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
}) => {
  const [query, setQuery] = useState<string>(value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSearchClick = () => {
    onSearch(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch(query);
    }
  };

  return (
    <div className="search-bar wide-search-bar">
      <div className="search-input-container">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="search-input"
        />
        {onFilterToggle && (
          <button
            type="button"
            className={`search-filter-button ${isFilterActive ? "active" : ""}`}
            onClick={onFilterToggle}
            title="Розширений пошук (фільтри)"
          >
            <FilterAltIcon />
          </button>
        )}
      </div>
      <button className="search-button" onClick={handleSearchClick}>
        {icon || <SearchIcon />}
      </button>
    </div>
  );
};

export default SearchBar;