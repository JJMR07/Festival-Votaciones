import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, ArrowLeft, ArrowRight, Music2, Disc3, Layers3, CalendarDays, Sparkles } from 'lucide-react';
import { useApp } from './context';
import { useResource } from './hooks';
import { Artwork, CatalogCard, Empty, Filters, Notice, PageHeading, Pagination, ResourceState } from './components';

export function Home() {
  const { config, t } = useApp();
  const categories = useResource('categorias/?limite=3');
  const editions = useResource('ediciones/?limite=1');
  const polls = useResource('votaciones/?limite=1');
  useEffect(() => { document.title = config.nombre; }, [config.nombre]);
  return <>
    <section className="hero wrap"><div className="hero-copy"><span className="eyebrow"><span/>{t.eyebrow}</span><h1>{t.titulo_inicio}</h1><p>{t.descripcion_inicio}</p><div className="hero-actions"><Link className="btn" to="/votaciones/">{t.explorar}<ArrowUpRight size={18}/></Link><Link className="text-link" to="/categorias/">{t.ver_categorias}<ArrowRight size={17}/></Link></div><div className="hero-note"><span className="little-lines">♫</span><span>{config.subtitulo}</span></div></div>
      <div className="hero-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><span className="art-topline">{config.nombre_corto}</span><Artwork src={config.imagen_portada} className="hero-image"/><span className="art-bottomline"><Music2 size={17}/>{t.eyebrow}</span><div className="floating-label"><span className="tiny-dot"/><strong>{editions.data?.items[0]?.anio || '♪'}</strong><span>{editions.data?.items[0]?.nombre || config.nombre_corto}</span></div></div>
    </section>
    <section className="stats-bar wrap" aria-label={t.explorar}>{[[editions, t.ediciones, CalendarDays],[categories, t.categorias, Layers3],[polls, t.votaciones, Disc3]].map(([r, label, Icon]) => <div className="stat" key={label}><Icon size={24}/><strong>{r.data?.total ?? '—'}</strong><span>{label}</span></div>)}<div className="stat-motto"><Sparkles size={19}/><span>{t.pie}</span></div></section>
    <section className="catalog-section wrap"><div className="section-heading"><div><span className="eyebrow">{t.categorias}</span><h2>{t.titulo_catalogo}</h2></div><Link className="text-link" to="/categorias/">{t.ver_categorias}<ArrowUpRight size={18}/></Link></div><ResourceState resource={categories}/>{categories.data && (categories.data.items.length ? <div className="card-grid">{categories.data.items.map(item => <CatalogCard key={item.id} item={item} kind="categorias"/>)}</div> : <Empty/>)}</section>
    <section className="community wrap"><div className="community-icon"><Music2 size={44}/></div><div><span className="eyebrow">{config.subtitulo}</span><h2>{t.titulo_registro}</h2><p>{t.descripcion_registro}</p></div><Link className="btn" to={config.registro_habilitado ? '/cuentas/registro/' : '/votaciones/'}>{config.registro_habilitado ? t.registro : t.explorar}<ArrowUpRight size={18}/></Link></section>
  </>;
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
  const page = number => { const next = new URLSearchParams(params); next.set('pagina', number); setParams(next); window.scrollTo({ top: 180, behavior: 'smooth' }); };
  return <div className="wrap page-content"><PageHeading eyebrow={t[kind]} title={t[`titulo_${titleKey}`]} description={t[`descripcion_${titleKey}`]}/>
    <Filters params={params} setParams={setParams} showEditions={kind !== 'ediciones'} showCategories={apiKind === 'votaciones'}/>
    {isResults && <Notice/>}
    <ResourceState resource={resource}/>
    {resource.data && <><div className="collection-meta"><span>{t[kind]}</span><span className="count-pill">{resource.data.total}</span></div>{resource.data.items.length ? <div className="card-grid">{resource.data.items.map(item => <CatalogCard key={item.id} item={item} kind={apiKind}/>)}</div> : <Empty/>}<Pagination data={resource.data} onChange={page}/></>}
  </div>;
}

export function Detail() {
  const { id } = useParams();
  const { t, config } = useApp();
  const [params, setParams] = useSearchParams();
  const resource = useResource(`votaciones/${id}/?pagina=${params.get('pagina') || 1}`);
  const item = resource.data;
  useEffect(() => { if (item) document.title = `${item.titulo} · ${config.nombre_corto}`; }, [item, config.nombre_corto]);
  return <div className="wrap page-content"><Link className="back-link" to={item ? `/votaciones/?edicion=${item.edicion_id}&categoria=${item.categoria_id}` : '/votaciones/'}><ArrowLeft size={17}/>{t.volver}</Link><ResourceState resource={resource}/>{item && <>
    <section className="detail-hero"><div><span className="eyebrow">{item.categoria_nombre} · {item.anio}</span><h1>{item.titulo}</h1><p>{item.descripcion || t.sin_descripcion}</p><span className={`status status-${item.estado}`}>{t[`estado_${item.estado}`]}</span><dl className="detail-dates"><div><dt>{t.inicio_fecha}</dt><dd>{formatDate(item.fecha_inicio, t.sin_fecha)}</dd></div><div><dt>{t.cierre_fecha}</dt><dd>{formatDate(item.fecha_cierre, t.sin_fecha)}</dd></div></dl></div><Artwork src={item.imagen} className="detail-image"/></section>
    <Notice/><div className="section-heading"><div><span className="eyebrow">{item.edicion_nombre}</span><h2>{t.opciones} <span className="inline-count">{item.opciones.total}</span></h2></div></div>
    {item.opciones.items.length ? <div className="participant-grid">{item.opciones.items.map(option => <article className="participant" key={option.id}><Artwork src={option.imagen}/><div><h3>{option.nombre}</h3><p>{option.descripcion || t.sin_descripcion}</p></div></article>)}</div> : <Empty message={t.sin_opciones}/>}
    <Pagination data={item.opciones} onChange={pagina => setParams({ pagina })}/>
  </>}</div>;
}

export function formatDate(value, fallback = '') {
  return value ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'America/Bogota' }).format(new Date(value)) : fallback;
}

export function NotFound() { const { t } = useApp(); return <div className="wrap page-content"><Empty message={t.no_encontrado}/><Link className="btn" to="/">{t.ver_inicio}</Link></div>; }
