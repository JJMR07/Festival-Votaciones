import { Link } from 'react-router-dom';
import { ArrowUpRight, Award, CalendarDays, UsersRound } from 'lucide-react';
import { useApp } from '../app/context';
import { formatDate } from '../app/date';

export function CategoryCard({ item }) {
  const { t } = useApp();
  return <article className="category-list-card">
    <div className="category-list-icon"><Award size={34}/></div>
    <div className="category-list-copy">
      <span className="category-list-edition">{item.edicion_nombre} · {item.anio}</span>
      <h2>{item.nombre}</h2>
      <p>{item.descripcion || t.sin_descripcion}</p>
    </div>
    <Link className="btn" to={`/votaciones/?categoria=${item.id}&edicion=${item.edicion_id}`}>
      {t.ver_votaciones}<ArrowUpRight size={17}/>
    </Link>
  </article>;
}

export function PollCard({ item, isResults = false, returnTo }) {
  const { t } = useApp();
  return <article className="poll-card">
    <header className="poll-card-heading">
      <span className={`status status-${item.estado}`}>{t[`estado_${item.estado}`]}</span>
      <span className="poll-edition">{item.edicion_nombre} · {item.anio} · {item.categoria_nombre}</span>
    </header>
    <h2>{item.titulo}</h2>
    <p>{item.descripcion || t.sin_descripcion}</p>
    <ul className="poll-meta">
      <li><CalendarDays size={16}/><span>{t.inicio_fecha}: {formatDate(item.fecha_inicio, t.sin_fecha)}</span></li>
      <li><CalendarDays size={16}/><span>{t.cierre_fecha}: {formatDate(item.fecha_cierre, t.sin_fecha)}</span></li>
      <li><UsersRound size={16}/><span>{item.total_opciones} {item.total_opciones === 1 ? t.opcion_singular : t.opciones.toLowerCase()}</span></li>
    </ul>
    <footer className="poll-actions">
      <Link className="btn" to={`/votaciones/${item.id}/`} state={{ returnTo }}>{t.ver_detalle}<ArrowUpRight size={17}/></Link>
      {!isResults && <Link className="btn btn-outline" to={`/resultados/?edicion=${item.edicion_id}&categoria=${item.categoria_id}`}>
        {t.resultados}
      </Link>}
    </footer>
  </article>;
}
