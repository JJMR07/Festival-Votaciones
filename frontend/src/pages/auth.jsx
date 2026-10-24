import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, CheckCircle2, UserRound, LockKeyhole, Settings2 } from 'lucide-react';
import { useApp } from '../app/context';
import { post } from '../app/api';
import { formatDate } from '../app/date';
import { Artwork, PageHeading } from '../components/shared';

export function Field({ name, label, errors, ...props }) {
  const messages = errors?.[name];
  return <div className="field"><label htmlFor={name}>{label}</label><input id={name} name={name} aria-invalid={!!messages} aria-describedby={messages ? `${name}-error` : undefined} {...props}/>{messages && <p id={`${name}-error`} className="field-error">{messages.map(e => e.message).join(' ')}</p>}</div>;
}

export function AuthPage({ register = false }) {
  const { config, t, user, setUser, authReady, authError, refreshSession } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const formRef = useRef(null);
  useEffect(() => { if (Object.keys(errors).length) formRef.current?.querySelector('[aria-invalid="true"], [role="alert"]')?.focus(); }, [errors]);
  useEffect(() => { setErrors({}); setMessage(''); }, [register]);
  if (user) return <Navigate to="/cuentas/perfil/" replace/>;
  const disabled = register && !config.registro_habilitado;
  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage(''); setErrors({});
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const result = await post(register ? 'auth/registro/' : 'auth/login/', data);
      setUser(result.user);
      const next = location.state?.from;
      navigate(typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/cuentas/perfil/', { replace: true });
    } catch (error) {
      setErrors(error.fields || {});
      setMessage(error.fields ? t.error_formulario : error.status === 403 ? t.sesion_expirada : t.error);
      if (error.status === 403) await refreshSession();
    } finally { setBusy(false); }
  }
  return <div className="wrap auth-layout auth-page"><aside className="auth-illustration"><Artwork src={config.imagen_portada}/><div><span className="eyebrow">{config.subtitulo}</span><h2>{config.nombre}</h2><p>{t.pie}</p></div></aside><div className="auth-panel"><PageHeading eyebrow={register ? t.registro : t.entrar} title={register ? t.titulo_registro : t.titulo_login} description={register ? t.descripcion_registro : t.descripcion_login}/>
    {disabled ? <p className="notice">{t.cuenta_deshabilitada}</p> : <form ref={formRef} className="auth-form" onSubmit={submit} aria-busy={busy}>
      {message && <div className="form-alert" role="alert" tabIndex={-1}>{message}</div>}
      {errors.__all__ && <p className="field-error" role="alert" tabIndex={-1}>{errors.__all__.map(e => e.message).join(' ')}</p>}
      <Field name="username" label={t.usuario} required maxLength={150} autoComplete="username" errors={errors}/>
      {register && <><Field name="first_name" label={t.nombre} required maxLength={150} autoComplete="name" errors={errors}/><Field name="email" label={t.correo} required type="email" autoComplete="email" errors={errors}/></>}
      <Field name={register ? 'password1' : 'password'} label={t.contrasena} required type="password" autoComplete={register ? 'new-password' : 'current-password'} errors={errors}/>
      {register && <Field name="password2" label={t.confirmar} required type="password" autoComplete="new-password" errors={errors}/>}
      <button className="btn full-width" disabled={busy || !authReady || authError}>{busy ? t.enviando : register ? t.registro : t.entrar}<ArrowUpRight size={18}/></button>
      {authError && <p className="field-error" role="alert" tabIndex={-1}>{t.error} <button type="button" onClick={refreshSession}>{t.reintentar}</button></p>}
    </form>}
    {!register && <p className="auth-switch"><Link to="/cuentas/recuperar/">{t.recuperar_contrasena}</Link></p>}
    <p className="auth-switch">{register ? t.ya_cuenta : t.sin_cuenta} <Link to={register ? '/cuentas/login/' : '/cuentas/registro/'}>{register ? t.entrar : t.registro}</Link></p><div className="auth-security"><LockKeyhole size={14}/>{config.nombre_corto}</div>
  </div></div>;
}

export function Profile() {
  const { t, user, setUser, authReady, authError, refreshSession } = useApp();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const formRef = useRef(null);
  useEffect(() => { if (Object.keys(errors).length) formRef.current?.querySelector('[aria-invalid="true"], [role="alert"]')?.focus(); }, [errors]);
  if (!authReady) return <div className="state" role="status">{t.cargando}</div>;
  if (authError) return <div className="state" role="alert">{t.error}<button className="btn" onClick={refreshSession}>{t.reintentar}</button></div>;
  if (!user) return <Navigate to="/cuentas/login/" state={{ from: location.pathname }} replace/>;
  async function submit(event) {
    event.preventDefault(); setBusy(true); setErrors({}); setMessage('');
    try { const result = await post('auth/perfil/', Object.fromEntries(new FormData(event.currentTarget))); setUser(result.user); setMessage(t.guardado); }
    catch (error) { setErrors(error.fields || {}); setMessage(error.fields ? t.error_formulario : t.error); if (error.status === 401 || error.status === 403) await refreshSession(); }
    finally { setBusy(false); }
  }
  return <div className="wrap page-content"><PageHeading eyebrow={t.perfil} title={t.titulo_perfil} description={t.descripcion_perfil}/><p className="profile-password-link"><Link className="btn btn-outline" to="/cuentas/contrasena/">{t.cambiar_contrasena}</Link></p><div className="profile-layout"><aside className="profile-card"><div className="avatar"><UserRound size={36}/></div><h2>{user.first_name || user.username}</h2><p>@{user.username}</p><span className="profile-status"><CheckCircle2 size={15}/>{t.cuenta_activa}</span><hr/><small>{t.miembro_desde}</small><p>{formatDate(user.date_joined)}</p></aside><div><form ref={formRef} className="profile-form" onSubmit={submit} aria-busy={busy}><Field name="first_name" label={t.nombre} defaultValue={user.first_name} required maxLength={150} errors={errors}/><Field name="email" label={t.correo} defaultValue={user.email} type="email" required errors={errors}/><p role="status">{message}</p><button className="btn" disabled={busy}>{busy ? t.enviando : t.guardar}<ArrowUpRight size={17}/></button></form>{user.is_staff && <aside className="admin-callout"><Settings2/><div><h3>{t.gestion}</h3><p>{t.gestion_descripcion}</p><a className="text-link" href="/admin/">{t.administrar}<ArrowUpRight size={17}/></a></div></aside>}</div></div></div>;
}
