import { useEffect } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, ArrowLeft } from 'lucide-react';
import { useApp } from '../app/context';
import { useResource } from '../app/hooks';
import { Breadcrumbs, CatalogSkeleton, ParticipantCard, ResultsIntro } from '../components/experience';
import { CategoryCard, PollCard } from '../components/catalog-cards';
import { formatDate } from '../app/date';
import { Artwork, CatalogCard, Empty, Filters, Notice, PageHeading, Pagination, ResourceState } from '../components/shared';

export function Home() {
  const { config, t } = useApp();
  const categories = useResource('categorias/?limite=4');
  useEffect(() => { document.title = config.nombre; }, [config.nombre]);
  const categoryLink = item => `/votaciones/?categoria=${item.id}&edicion=${item.edicion_id}`;
  return <div className="home-main">
    <section className="voting-section">
      <h2>{config.subtitulo}</h2>
      <h1>{t.votaciones}</h1>
      <p>{t.descripcion_inicio}</p>
      <div className="voting-button"><Link className="btn" to="/votaciones/">{t.ver_votaciones}<ArrowUpRight size={18}/></Link></div>
    </section>
    <section id="categories" className="home-categories">
      <header className="home-categories-header"><h2>{t.categorias}</h2><Link to="/categorias/">{t.ver_categorias}</Link></header>
      <ResourceState resource={categories} skeleton={<CatalogSkeleton/>}/>
      {categories.data?.items.length > 0 && <div className="home-categories-grid">
        {categories.data.items.map(item => <article className="home-category-card" key={item.id}>
          <Link className="home-category-image" to={categoryLink(item)} aria-label={`${t.ver_detalle}: ${item.nombre}`}><Artwork src={item.imagen}/></Link>
          <div className="home-category-content"><h3>{item.nombre}</h3><p>{item.descripcion || t.sin_descripcion}</p><footer><Link className="btn" to={categoryLink(item)}>{t.ver_votaciones}</Link></footer></div>
        </article>)}
      </div>}
      {categories.data && categories.data.items.length === 0 && <Empty/>}
    </section>
  </div>;
}

export function Catalog({ kind }) {
  const { t } = useApp();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const isResults = kind === 'resultados';
  const apiKind = isResults ? 'votaciones' : kind;
  const query = new URLSearchParams();
  for (const key of ['edicion', 'categoria', 'q', 'pagina']) if (params.get(key)) query.set(key, params.get(key));
  const resource = useResource(`${apiKind}/?${query}`);
  const titleKey = kind === 'categorias' ? 'catalogo' : kind;
  const page = number => { const next = new URLSearchParams(params); next.set('pagina', number); setParams(next); window.scrollTo({ top: 180, behavior: 'smooth' }); };
  return <div className={`wrap page-content catalog-page catalog-${kind}`}>
    <Breadcrumbs items={[{ label: t[kind] }]}/>
    <PageHeading eyebrow={t[kind]} title={t[`titulo_${titleKey}`]} description={t[`descripcion_${titleKey}`]}/>
    <Filters params={params} setParams={setParams} showEditions={kind !== 'ediciones'} showCategories={apiKind === 'votaciones'}/>
    {isResults && <ResultsIntro/>}
    <ResourceState resource={resource} skeleton={<CatalogSkeleton/>}/>
    {resource.data && <>
      <div className="collection-meta"><span>{t[kind]}</span><span className="count-pill">{resource.data.total}</span></div>
      <CatalogItems items={resource.data.items} kind={apiKind} isResults={isResults} returnTo={`${location.pathname}${location.search}`}/>
      <Pagination data={resource.data} onChange={page}/>
    </>}
  </div>;
}

function CatalogItems({ items, kind, isResults, returnTo }) {
  if (!items.length) return <Empty/>;
  if (kind === 'categorias') return <div className="category-list-grid">
    {items.map(item => <CategoryCard key={item.id} item={item}/>)}
  </div>;
  if (kind === 'votaciones') return <div className="poll-list">
    {items.map(item => <PollCard key={item.id} item={item} isResults={isResults} returnTo={returnTo}/>)}
  </div>;
  return <div className="card-grid">
    {items.map(item => <CatalogCard key={item.id} item={item} kind={kind}/>)}
  </div>;
}

export function Detail() {
  const { id } = useParams();
  const location = useLocation();
  const { t, config } = useApp();
  const [params, setParams] = useSearchParams();
  const resource = useResource(`votaciones/${id}/?pagina=${params.get('pagina') || 1}`);
  const item = resource.data;
  useEffect(() => { if (item) document.title = `${item.titulo} · ${config.nombre_corto}`; }, [item, config.nombre_corto]);
  const savedReturn = location.state?.returnTo;
  const returnTo = typeof savedReturn === 'string' && /^\/(votaciones|resultados)\/(\?.*)?$/.test(savedReturn)
    ? savedReturn : item ? `/votaciones/?edicion=${item.edicion_id}&categoria=${item.categoria_id}` : '/votaciones/';
  return <div className="wrap page-content detail-page">
    <Breadcrumbs items={[
      { label: t.categorias, to: item ? `/categorias/?edicion=${item.edicion_id}` : '/categorias/' },
      { label: item?.categoria_nombre || t.votaciones, to: item ? `/votaciones/?edicion=${item.edicion_id}&categoria=${item.categoria_id}` : '/votaciones/' },
      { label: item?.titulo || t.ver_detalle },
    ]}/>
    <Link className="back-link" to={returnTo}><ArrowLeft size={17}/> {t.volver_listado}</Link>
    <ResourceState resource={resource} skeleton={<CatalogSkeleton/>}/>{item && <>
    <article className="detail-card">
      <header className="detail-card-header"><span className={`status status-${item.estado}`}>{t[`estado_${item.estado}`]}</span><h1>{item.titulo}</h1><p>{item.categoria_nombre} · {item.edicion_nombre}</p></header>
      <p className="detail-description">{item.descripcion || t.sin_descripcion}</p>
      <dl className="detail-facts"><div><dt>{t.inicio_fecha}</dt><dd>{formatDate(item.fecha_inicio, t.sin_fecha)}</dd></div><div><dt>{t.cierre_fecha}</dt><dd>{formatDate(item.fecha_cierre, t.sin_fecha)}</dd></div><div><dt>{t.opciones}</dt><dd>{item.opciones.total}</dd></div></dl>
      <Notice/>
      <section className="detail-participants" id="participantes"><header className="section-heading"><div><span className="eyebrow">{item.edicion_nombre} · {item.anio}</span><h2>{t.opciones}</h2></div><span className="count-pill">{item.opciones.total}</span></header>
        {item.opciones.items.length ? <div className="participant-grid">{item.opciones.items.map(option => <ParticipantCard key={option.id} item={option} context={`${item.categoria_nombre} · ${item.edicion_nombre}`}/>)}</div> : <Empty message={t.sin_opciones}/>}
        <Pagination data={item.opciones} onChange={pagina => setParams({ pagina }, { state: location.state })}/>
      </section>
    </article>
  </>}</div>;
}

export function NotFound() { const { t } = useApp(); return <div className="wrap page-content"><Empty message={t.no_encontrado}/><Link className="btn" to="/">{t.ver_inicio}</Link></div>; }
