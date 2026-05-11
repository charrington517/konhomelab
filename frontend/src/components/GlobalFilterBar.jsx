const STATUS_FILTERS = [
  ["all", "All"],
  ["healthy", "Healthy"],
  ["warning", "Warning"],
  ["critical", "Critical"],
  ["offline", "Offline"]
];

const CATEGORY_FILTERS = [
  ["all", "All"],
  ["infrastructure", "Infrastructure"],
  ["media", "Media"],
  ["storage", "Storage"],
  ["ai", "AI"],
  ["network", "Network"]
];

function GlobalFilterBar({ filters, onChange, totalServices, visibleServices }) {
  function update(next) {
    onChange({ ...filters, ...next });
  }

  return (
    <section className="filter-bar" aria-label="Global search and quick filters">
      <label className="filter-search">
        <span>Search</span>
        <input
          value={filters.query}
          onChange={event => update({ query: event.target.value })}
          placeholder="Service, host, warning, app..."
          type="search"
        />
      </label>

      <div className="filter-group" aria-label="Status filters">
        {STATUS_FILTERS.map(([value, label]) => (
          <button
            className={filters.status === value ? "active" : ""}
            type="button"
            onClick={() => update({ status: value })}
            key={value}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="filter-group" aria-label="Category filters">
        {CATEGORY_FILTERS.map(([value, label]) => (
          <button
            className={filters.category === value ? "active" : ""}
            type="button"
            onClick={() => update({ category: value })}
            key={value}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="filter-count">
        <strong>{visibleServices}</strong>
        <span>of {totalServices} services</span>
      </div>
    </section>
  );
}

export default GlobalFilterBar;
