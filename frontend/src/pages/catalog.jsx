import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, ArrowLeft, Award, CalendarDays, UsersRound } from 'lucide-react';
import { useApp } from '../app/context';
import { useResource } from '../app/hooks';
import { formatDate } from '../app/date';
import { Artwork, CatalogCard, Empty, Filters, Notice, PageHeading, Pagination, ResourceState } from '../components/shared';

export function Home() {
  const { config, t } = useApp();
  const categories = useResource('categorias/?limite=4');
  useEffect(() => { document.title = config.nombre; }, [config.nombre]);
  const categoryLink = item => `/votaciones/?categoria=${item.id}&edicion=${item.edicion_id}`;
  return <div className="home-main">
    <section className="voting-section">
      <h2>{config.subtitulo || 'Patrimonio Cultural Colombiano'}</h2>
      <h1>{t.votaciones}</h1>
      <p>{t.descripcion_inicio}</p>
      <div className="voting-button"><Link className="btn" to="/votaciones/">{t.ver_votaciones}<ArrowUpRight size={18}/></Link></div>
    </section>
    <section id="categories" className="home-categories">
      <header className="home-categories-header"><h2>{t.categorias} principales</h2><Link to="/categorias/">{t.ver_categorias}</Link></header>
      <ResourceState resource={categories}/>
      {categories.data?.items.length > 0 && <div className="home-categories-grid">
        {categories.data.items.map(item => <article className="home-category-card" key={item.id}>
          <Link className="home-category-image" to={categoryLink(item)} aria-label={`${t.ver_detalle}: ${item.nombre}`}><Artwork src={item.imagen}/></Link>
          <div className="home-category-content"><h3>{item.nombre}</h3><p>{item.descripcion || t.sin_descripcion}</p><footer><Link className="btn" to={categoryLink(item)}>{t.ver_votaciones}</Link></footer></div>
        </article>)}
      </div>}
    </section>
  </div>;
}

export function Catalog({ kind }) {
  const { t } = useApp();
  const [params, setParams] = useSearchParams();
  const isResults = kind === 'resultados';
  const apiKind = isResults ? 'votaciones' : kind;
  const query = new URLSearchParams();
  for (const key of ['edicion', 'categoria', 'q', 'pagina']) if (params.get(key)) query.set(key, params.get(key));
  const resource = useResource(`${apiKind}/?${query}`);
  const titleKey = kind === 'categorias' ? 'catalogo' : kind;
  const pageTitle = kind === 'categorias' ? 'Categorías oficiales' : kind === 'votaciones' ? 'Votaciones disponibles' : kind === 'resultados' ? 'Resultados de votación' : t[`titulo_${titleKey}`];
  const pageDescription = kind === 'categorias'
    ? 'Descubre las categorías disponibles para participar en las votaciones del Festival Vallenato.'
    : kind === 'votaciones'
      ? 'Selecciona la categoría en la que deseas participar y conoce sus participantes.'
      : kind === 'resultados'
        ? 'Consulta la información publicada de cada proceso de votación.'
        : t[`descripcion_${titleKey}`];
  const page = number => { const next = new URLSearchParams(params); next.set('pagina', number); setParams(next); window.scrollTo({ top: 180, behavior: 'smooth' }); };
  return <div className={`wrap page-content catalog-page catalog-${kind}`}><Link className="back-link catalog-back" to="/"><ArrowLeft size={17}/>{t.ver_inicio}</Link><PageHeading eyebrow={t[kind]} title={pageTitle} description={pageDescription}/>
    {kind !== 'categorias' && <Filters params={params} setParams={setParams} showEditions={kind !== 'ediciones'} showCategories={apiKind === 'votaciones'}/>}
    {isResults && <Notice/>}
    <ResourceState resource={resource}/>
    {resource.data && <><div className="collection-meta"><span>{t[kind]}</span><span className="count-pill">{resource.data.total}</span></div>{resource.data.items.length ? kind === 'categorias' ? <div className="category-list-grid">{resource.data.items.map(item => <article className="category-list-card" key={item.id}><div className="category-list-icon"><Award size={34}/></div><div className="category-list-copy"><span className="category-list-edition">{item.edicion_nombre} · {item.anio}</span><h2>{item.nombre}</h2><p>{item.descripcion || t.sin_descripcion}</p></div><Link className="btn" to={`/votaciones/?categoria=${item.id}&edicion=${item.edicion_id}`}>{t.ver_votaciones}<ArrowUpRight size={17}/></Link></article>)}</div> : apiKind === 'votaciones' ? <div className="poll-list">{resource.data.items.map(item => <article className="poll-card" key={item.id}><header className="poll-card-heading"><span className={`status status-${item.estado}`}>{t[`estado_${item.estado}`]}</span><span className="poll-edition">{item.categoria_nombre} · {item.anio}</span></header><h2>{item.titulo}</h2><p>{item.descripcion || t.sin_descripcion}</p><ul className="poll-meta"><li><CalendarDays size={16}/><span>{item.fecha_cierre ? `${t.cierre_fecha}: ${formatDate(item.fecha_cierre, t.sin_fecha)}` : `${t.cierre_fecha}: ${t.sin_fecha}`}</span></li><li><UsersRound size={16}/><span>{item.total_opciones} {t.opciones.toLowerCase()}</span></li></ul><footer className="poll-actions"><Link className="btn" to={`/votaciones/${item.id}/`}>{t.ver_detalle}<ArrowUpRight size={17}/></Link><Link className="btn btn-outline" to={`/resultados/?edicion=${item.edicion_id}&categoria=${item.categoria_id}`}>{t.resultados}</Link></footer></article>)}</div> : <div className="card-grid">{resource.data.items.map(item => <CatalogCard key={item.id} item={item} kind={apiKind}/>)}</div> : <Empty/>}<Pagination data={resource.data} onChange={page}/></>}
  </div>;
}

export function Detail() {
  const { id } = useParams();
  const { t, config } = useApp();
  const [params, setParams] = useSearchParams();
  const resource = useResource(`votaciones/${id}/?pagina=${params.get('pagina') || 1}`);
  const item = resource.data;
  useEffect(() => { if (item) document.title = `${item.titulo} · ${config.nombre_corto}`; }, [item, config.nombre_corto]);
  return <div className="wrap page-content detail-page"><Link className="back-link" to={item ? `/votaciones/?edicion=${item.edicion_id}&categoria=${item.categoria_id}` : '/votaciones/'}><ArrowLeft size={17}/>{t.volver}</Link><ResourceState resource={resource}/>{item && <>
    <article className="detail-card">
      <header className="detail-card-header"><span className={`status status-${item.estado}`}>{t[`estado_${item.estado}`]}</span><h1>{item.titulo}</h1><p>{item.categoria_nombre} · {item.edicion_nombre}</p></header>
      <p className="detail-description">{item.descripcion || t.sin_descripcion}</p>
      <dl className="detail-facts"><div><dt>{t.inicio_fecha}</dt><dd>{formatDate(item.fecha_inicio, t.sin_fecha)}</dd></div><div><dt>{t.cierre_fecha}</dt><dd>{formatDate(item.fecha_cierre, t.sin_fecha)}</dd></div><div><dt>{t.opciones}</dt><dd>{item.opciones.total}</dd></div></dl>
      <Notice/>
      <section className="detail-participants" id="participantes"><header className="section-heading"><div><span className="eyebrow">{item.edicion_nombre} · {item.anio}</span><h2>{t.opciones}</h2></div><span className="count-pill">{item.opciones.total}</span></header>
        {item.opciones.items.length ? <div className="participant-grid">{item.opciones.items.map(option => <article className="participant" key={option.id}><Artwork src={option.imagen}/><div><h3>{option.nombre}</h3><p>{option.descripcion || t.sin_descripcion}</p></div></article>)}</div> : <Empty message={t.sin_opciones}/>}
        <Pagination data={item.opciones} onChange={pagina => setParams({ pagina })}/>
      </section>
    </article>
  </>}</div>;
}

export function NotFound() { const { t } = useApp(); return <div className="wrap page-content"><Empty message={t.no_encontrado}/><Link className="btn" to="/">{t.ver_inicio}</Link></div>; }
