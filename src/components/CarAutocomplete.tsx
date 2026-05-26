import { useState, useEffect, useRef } from "react";

export default function CarAutocomplete() {
  const [brands, setBrands] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchCarBrands() {
      try {
        const response = await fetch(
          "https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json"
        );
        const data = await response.json();
        if (data && data.Results) {
          const brandNames: string[] = data.Results.map((item: any) => item.MakeName).sort();
          setBrands(brandNames);
        }
      } catch (error) {
        console.error("Erro ao buscar marcas de carros:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCarBrands();
  }, []);

  useEffect(() => {
    if (query.trim() === "") {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const filtered = brands.filter((brand) =>
      brand.toLowerCase().includes(query.toLowerCase())
    );

    setSuggestions(filtered);
    setIsOpen(true);
  }, [query, brands]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={wrapperRef}>
      <input
        type="text"
        placeholder={isLoading ? "Carregando marcas..." : "Digite a marca do carro..."}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (query.trim() !== "" && suggestions.length > 0) setIsOpen(true);
        }}
        disabled={isLoading}
        className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
      />
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 bg-white border border-slate-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto w-full">
          {suggestions.map((brand, index) => (
            <li
              key={index}
              onClick={() => {
                setQuery(brand);
                setIsOpen(false);
              }}
              className="px-3 py-2 text-sm hover:bg-slate-100 cursor-pointer"
            >
              {brand}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
