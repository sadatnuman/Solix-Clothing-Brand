"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "../lib/api";
import ProductCard from "./ProductCard";

const initial = (params) => ({
  search: params.get("q") || "", category: params.get("category") || "", collection: params.get("collection") || "",
  size: params.get("size") || "", colour: params.get("colour") || "", maxPrice: params.get("maxPrice") || "",
  inStock: params.get("stock") || "", discounted: params.get("discounted") || "", sort: params.get("sort") || "newest",
});

export default function Shop() {
  const params = useSearchParams();
  const searchRef = useRef(null);
  const [filters, setFilters] = useState(() => initial(params));
  const [products, setProducts] = useState([]);
  const [options, setOptions] = useState({ categories: [], collections: [], sizes: [], colours: [] });
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [suggestions, setSuggestions] = useState([]);
  const [page, setPage] = useState(Number(params.get("page") || 1));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/collections'), api.get('/sizes'), api.get('/products/filter-options')]).then(([categories, collections, sizes, filters]) => setOptions({ categories: categories.data.data || [], collections: collections.data.data || [], sizes: sizes.data.data || [], colours: filters.data.data.colours || [] })).catch(() => {});
  }, []);
  useEffect(() => { if (params.get("focus") === "search") searchRef.current?.focus(); }, [params]);
  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true); setError("");
      try {
        const query = { page, limit: 12, sort: filters.sort };
        if (filters.search) query.search = filters.search;
        if (filters.category) query.category = filters.category;
        if (filters.collection) query.collection = filters.collection;
        if (filters.size) query.size = filters.size;
        if (filters.colour) query.colour = filters.colour;
        if (filters.maxPrice) query.maxPrice = filters.maxPrice;
        if (filters.inStock) query.inStock = 'true';
        if (filters.discounted) query.discounted = 'true';
        const response = await api.get('/products', { params: query });
        setProducts(response.data.data || []); setMeta(response.data.meta || { page: 1, pages: 1, total: 0 });
      } catch { setError('The collection could not be loaded. Please try again.'); }
      finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [filters, page]);
  useEffect(() => {
    const next = new URLSearchParams();
    if (filters.search) next.set('q', filters.search); if (filters.category) next.set('category', filters.category);
    if (filters.collection) next.set('collection', filters.collection); if (filters.size) next.set('size', filters.size);
    if (filters.colour) next.set('colour', filters.colour); if (filters.maxPrice) next.set('maxPrice', filters.maxPrice);
    if (filters.inStock) next.set('stock', 'in-stock'); if (filters.discounted) next.set('discounted', 'true');
    if (filters.sort !== 'newest') next.set('sort', filters.sort); if (page > 1) next.set('page', String(page));
    window.history.replaceState(window.history.state, '', next.size ? `/shop?${next}` : '/shop');
  }, [filters, page]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.search.trim().length < 2) { setSuggestions([]); return; }
      api.get('/products/suggestions/search', { params: { q: filters.search } }).then((response) => setSuggestions(response.data.data || [])).catch(() => setSuggestions([]));
    }, filters.search.trim().length < 2 ? 0 : 180);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const set = (key) => (event) => { setFilters((current) => ({ ...current, [key]: event.target.type === 'checkbox' ? event.target.checked ? 'true' : '' : event.target.value })); setPage(1); };
  const active = useMemo(() => Object.entries(filters).filter(([key, value]) => value && !(key === 'sort' && value === 'newest')), [filters]);
  const clear = () => { setFilters({ search: '', category: '', collection: '', size: '', colour: '', maxPrice: '', inStock: '', discounted: '', sort: 'newest' }); setPage(1); setSuggestions([]); };
  const remove = (key) => { setFilters((current) => ({ ...current, [key]: key === 'sort' ? 'newest' : '' })); setPage(1); };

  return <main className="section shop">
    <div className="shop-masthead"><div className="masthead-copy"><span className="eyebrow">SOLIX / COLLECTION 01</span><h1>Everyday,<br/><span>made better.</span></h1></div><div className="shop-intro"><span>THE SOLIX ROTATION</span><p>Easy pieces for slow mornings, long days and whatever comes next.</p><div className="collection-meta"><small>{loading ? 'CURATING THE COLLECTION' : `${meta.total} STYLES · PRICED IN BDT`}</small><small>COMPLIMENTARY DELIVERY</small></div></div></div>
    <div className="shop-toolbar"><button type="button" className="filter-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="shop-filters">Filters {active.length ? `(${active.length})` : ''} <span>＋</span></button><span>{meta.total} results</span></div>
    <div id="shop-filters" className={`shop-filters ${open ? 'open' : ''}`}>
      <label className={`search-field${filters.search ? ' filter-active' : ''}`}><span className="filter-label">Search</span><input ref={searchRef} type="search" placeholder="Search the collection" value={filters.search} onChange={set('search')} autoComplete="off" />{suggestions.length > 0 && <div className="search-suggestions">{suggestions.map((item) => <button type="button" key={item.id} onClick={() => { setFilters((current) => ({ ...current, search: item.name })); setSuggestions([]); }}>{item.name}</button>)}</div>}</label>
      <label className={filters.category ? 'filter-active' : ''}><span className="filter-label">Category</span><select value={filters.category} onChange={set('category')}><option value="">All categories</option>{options.categories.map((item) => <option value={item.slug || item.name} key={item.id}>{item.name}</option>)}</select></label>
      <label className={filters.collection ? 'filter-active' : ''}><span className="filter-label">Collection</span><select value={filters.collection} onChange={set('collection')}><option value="">All collections</option>{options.collections.map((item) => <option value={item.slug} key={item.id}>{item.name}</option>)}</select></label>
      <label className={filters.size ? 'filter-active' : ''}><span className="filter-label">Size</span><select value={filters.size} onChange={set('size')}><option value="">All sizes</option>{options.sizes.map((item) => <option value={item.name} key={item.id}>{item.name}</option>)}</select></label>
      <label className={filters.colour ? 'filter-active' : ''}><span className="filter-label">Colour</span><select value={filters.colour} onChange={set('colour')}><option value="">All colours</option>{options.colours.map((colour) => <option key={colour}>{colour}</option>)}</select></label>
      <label className={filters.maxPrice ? 'filter-active' : ''}><span className="filter-label">Budget</span><select value={filters.maxPrice} onChange={set('maxPrice')}><option value="">Any price</option><option value="1500">Under ৳1,500</option><option value="3000">Under ৳3,000</option><option value="5000">Under ৳5,000</option></select></label>
      <label><span className="filter-label">Sort</span><select value={filters.sort} onChange={set('sort')}><option value="newest">Newest first</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name A–Z</option></select></label>
      <div className="filter-checks"><label><input type="checkbox" checked={Boolean(filters.inStock)} onChange={set('inStock')} /> In stock</label><label><input type="checkbox" checked={Boolean(filters.discounted)} onChange={set('discounted')} /> On offer</label></div>
    </div>
    {active.length > 0 && <div className="filter-chips">{active.map(([key, value]) => <button type="button" key={key} onClick={() => remove(key)}>{key}: {value} ×</button>)}<button type="button" onClick={clear}>Clear all</button></div>}
    {loading ? <div className="product-grid">{[1,2,3,4].map((item) => <div className="skeleton" key={item} />)}</div> : error ? <div className="empty-state" role="alert"><p>{error}</p><button onClick={() => setPage((current) => current)}>Try again</button></div> : products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-state"><h2>No pieces found.</h2><p>Try removing one or two filters.</p><button onClick={clear}>Clear all filters</button></div>}
    {!loading && meta.pages > 1 && <nav className="pagination" aria-label="Product pages"><button disabled={page <= 1} onClick={() => { setPage(page - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>← Previous</button><span>{page} / {meta.pages}</span><button disabled={page >= meta.pages} onClick={() => { setPage(page + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Next →</button></nav>}
  </main>;
}
