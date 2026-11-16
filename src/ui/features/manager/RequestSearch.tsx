interface RequestSearchProps {
  query: string;
  onChange: (next: string) => void;
  onClear: () => void;
}

export function RequestSearch({ query, onChange, onClear }: RequestSearchProps) {
  return (
    <div className="filters-bar">
      <div className="field-group">
        <label htmlFor="request-search">Tìm theo tên người mượn hoặc mã thiết bị</label>
        <input
          id="request-search"
          type="search"
          data-testid="request-search"
          className="input-control"
          placeholder="Ví dụ: Bình hoặc TB-03"
          value={query}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {query ? (
        <button type="button" className="btn" onClick={onClear}>
          Xóa
        </button>
      ) : null}
    </div>
  );
}
