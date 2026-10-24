import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { useApp } from '../app/context';
import { post } from '../app/api';
import { useResource } from '../app/hooks';
import { Field } from './auth';
import { PageHeading, ResourceState } from '../components/shared';

export function PasswordPage({ mode }) {
  const { t, user, authReady, authError, refreshSession } = useApp();
  const { uidb64, token } = useParams();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  const form = useRef(null);
  const isReset = mode === 'restablecer';
  const isChange = mode === 'cambiar';
  const path = isReset ? `contrasena/restablecer/${uidb64}/${token}/` : `contrasena/${mode}/`;
  const validity = useResource(isReset ? `auth/${path}` : null);
  useEffect(() => { setDone(false); setErrors({}); setMessage(''); }, [mode, uidb64, token]);
  useEffect(() => {
    if (message && !done) form.current?.querySelector('[aria-invalid="true"], [role="alert"]')?.focus();
  }, [errors, message, done]);
  if (isChange && !authReady) return <div className="state" role="status">{t.cargando}</div>;
  if (isChange && authError) return <ResourceState resource={{ error: new Error(), retry: refreshSession }}/>;
  if (isChange && !user) return <Navigate to="/cuentas/login/" state={{ from: location.pathname }} replace/>;
  async function submit(event) {
    event.preventDefault(); setBusy(true); setErrors({}); setMessage('');
    try {
      await post(`auth/${path}`, Object.fromEntries(new FormData(event.currentTarget)));
      setDone(true);
      setMessage(mode === 'recuperar' ? t.enlace_enviado : t.contrasena_guardada);
    } catch (error) {
      setErrors(error.fields || {});
      setMessage(error.fields ? t.error_formulario : isReset && error.status === 400 ? t.enlace_invalido : t.error);
      if (error.status === 403) await refreshSession();
    } finally { setBusy(false); }
  }
  return <div className="wrap auth-layout auth-page"><div className="auth-panel">
    <PageHeading eyebrow={isChange ? t.cambiar_contrasena : t.recuperar_contrasena}
      title={t[`titulo_${mode}`]} description={t[`descripcion_${mode}`]}/>
    {isReset && (validity.loading || (validity.error && validity.error.status !== 400)) ? <ResourceState resource={validity}/> : isReset && validity.error ? <>
      <p role="alert" className="form-alert">{t.enlace_invalido}</p>
      <Link className="btn" to="/cuentas/recuperar/">{t.enviar_enlace}</Link>
    </> : done ? <div className="password-success" role="status"><p>{message}</p>
      <Link className="btn" to={isChange ? '/cuentas/perfil/' : '/cuentas/login/'}>{isChange ? t.perfil : t.entrar}</Link>
    </div> : <form ref={form} className="auth-form" aria-busy={busy} onSubmit={submit}>
      {message && <p tabIndex={-1} role="alert" className="form-alert">{message}</p>}
      {mode === 'recuperar' ? <Field name="email" label={t.correo} type="email" required autoComplete="email" errors={errors}/> : <>
        {isChange && <Field name="old_password" label={t.contrasena_actual} type="password" required autoComplete="current-password" errors={errors}/>}
        <Field name="new_password1" label={t.nueva_contrasena} type="password" required autoComplete="new-password" errors={errors}/>
        <Field name="new_password2" label={t.confirmar_nueva} type="password" required autoComplete="new-password" errors={errors}/>
      </>}
      <button className="btn full-width" disabled={busy || !authReady}>{busy ? t.enviando : mode === 'recuperar' ? t.enviar_enlace : t.cambiar_contrasena}</button>
    </form>}
    <p className="auth-switch"><Link to={isChange ? '/cuentas/perfil/' : '/cuentas/login/'}>{isChange ? t.perfil : t.entrar}</Link></p>
  </div></div>;
}
