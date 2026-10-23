import 'vite/modulepreload-polyfill';
import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-500.css';
import '@fontsource/poppins/latin-600.css';
import '@fontsource/poppins/latin-700.css';
import '@fontsource/raleway/latin-700.css';
import '@fontsource/raleway/latin-800.css';
import React, { Component } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { api } from './app/api';
import { AppProvider } from './app/context';
import { Layout } from './components/shared';
import { Home, Catalog, Detail, NotFound } from './pages/catalog';
import { AuthPage, Profile } from './pages/auth';
import './styles/base.css';
import './styles/brand.css';

const bootstrapNode = document.getElementById('app-bootstrap');
// Django proporciona el bootstrap compilado. Vite usa el proxy local en desarrollo.
const bootstrap = bootstrapNode ? JSON.parse(bootstrapNode.textContent) : { config: await api('configuracion/') };

class ErrorBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    return this.state.error ? <div className="state" role="alert"><h1>{bootstrap.config.textos.error}</h1><button className="btn" onClick={() => window.location.reload()}>{bootstrap.config.textos.reintentar}</button></div> : this.props.children;
  }
}

createRoot(document.getElementById('root')).render(<ErrorBoundary><BrowserRouter><AppProvider initialConfig={bootstrap.config}><Layout><Routes>
  <Route path="/" element={<Home/>}/>
  <Route path="/ediciones/" element={<Catalog kind="ediciones"/>}/>
  <Route path="/categorias/" element={<Catalog kind="categorias"/>}/>
  <Route path="/votaciones/" element={<Catalog kind="votaciones"/>}/>
  <Route path="/votaciones/:id/" element={<Detail/>}/>
  <Route path="/resultados/" element={<Catalog kind="resultados"/>}/>
  <Route path="/cuentas/login/" element={<AuthPage/>}/>
  <Route path="/cuentas/registro/" element={<AuthPage register/>}/>
  <Route path="/cuentas/perfil/" element={<Profile/>}/>
  <Route path="*" element={<NotFound/>}/>
</Routes></Layout></AppProvider></BrowserRouter></ErrorBoundary>);
