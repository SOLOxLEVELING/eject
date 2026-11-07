// Original local artwork shared by the chamber and escape scene.
export function Operator() {
  return (
    <svg className="operator" viewBox="0 0 48 64" aria-hidden="true">
      <ellipse className="operator-shadow" cx="24" cy="59" rx="20" ry="4" />
      <path className="operator-limbs" d="M10 27H5v20h7V34h24v13h7V27h-5M14 44v14h8V45m4 0v13h8V44" />
      <path className="operator-shell" d="M13 22h22l4 8-3 17H12L9 30zM13 5h22l4 5v14H9V10z" />
      <path className="operator-visor" d="M13 12h22v8H13z" />
      <path className="operator-signal" d="M16 14h6v4h-6zm9 0h7v4h-7zM15 33h7v7h-7z" />
      <path className="operator-detail" d="M27 33h6m-6 4h6M19 5V1h10v4" />
    </svg>
  );
}
