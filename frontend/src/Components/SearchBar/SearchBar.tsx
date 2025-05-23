import React, { useState, useEffect, ReactNode } from "react";
import "./SearchBar.css";
import SearchIcon from "@mui/icons-material/Search";

type SearchBarProps = {
  placeholder?: string;
  onSearch: (query: string) => void;
  value?: string;
  icon?: ReactNode;
};

const SearchBar: React.FC<SearchBarProps> = ({ placeholder = "Search...", onSearch, value = "", icon }) => {
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch(query);
    }
  };

  return (
    <div className="search-bar wide-search-bar">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className="search-input"
      />
      <button className="search-button" onClick={handleSearchClick}>
        {icon || <SearchIcon />}
      </button>
    </div>
  );
};

export default SearchBar;