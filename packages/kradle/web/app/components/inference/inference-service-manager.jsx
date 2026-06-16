'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { btnStyle } from './inference-helpers.jsx';
import { ServiceCard, CreateServiceForm, ServiceDetailPanel } from './inference-service-list.jsx';
import { RuntimeCard, CreateRuntimeForm } from './inference-runtime-list.jsx';
import { ModelRouteCard, CreateModelRouteForm } from './model-route-manager.jsx';
import { VirtualModelCard, CreateVirtualModelForm } from './virtual-model-manager.jsx';
import { CuratedModelCatalog, UnifiedModelCatalogSection } from './curated-model-catalog.jsx';
import { ConfirmDialog } from '../shell/confirm-dialog.jsx';
import { dedupFetch } from '../../lib/fetch-dedup.js';
import { tabStyle, createResource, ResourceTabContent } from './inference-service-helpers.jsx';

export function InferenceServiceManager({ org, initialServiceName }) {
  const [services, setServices] = useState([]);
  const [runtimes, setRuntimes] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [virtualModels, setVirtualModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('services');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRuntimeForm, setShowRuntimeForm] = useState(false);
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [showVirtualModelForm, setShowVirtualModelForm] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [svcLimit, setSvcLimit] = useState(25);
  const [svcOffset, setSvcOffset] = useState(0);
  const [svcTotal, setSvcTotal] = useState(0);
  const [rtLimit, setRtLimit] = useState(25);
  const [rtOffset, setRtOffset] = useState(0);
  const [rtTotal, setRtTotal] = useState(0);
  const [routeLimit, setRouteLimit] = useState(25);
  const [routeOffset, setRouteOffset] = useState(0);
  const [routeTotal, setRouteTotal] = useState(0);
  const [vmLimit, setVmLimit] = useState(25);
  const [vmOffset, setVmOffset] = useState(0);
  const [vmTotal, setVmTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [svcRes, rtRes, routeRes, vmRes] = await Promise.all([
        dedupFetch(`/api/orgs/${org}/inference/services?limit=${svcLimit}&offset=${svcOffset}`),
        dedupFetch(`/api/orgs/${org}/inference/runtimes?limit=${rtLimit}&offset=${rtOffset}`),
        dedupFetch(`/api/orgs/${org}/inference/routes?limit=${routeLimit}&offset=${routeOffset}`),
        dedupFetch(`/api/orgs/${org}/inference/virtual-models?limit=${vmLimit}&offset=${vmOffset}`),
      ]);
      const svcData = svcRes.ok ? await svcRes.json() : null;
      const rtData = rtRes.ok ? await rtRes.json() : null;
      const routeData = routeRes.ok ? await routeRes.json() : null;
      const vmData = vmRes.ok ? await vmRes.json() : null;
      setServices(svcData?.items || (Array.isArray(svcData) ? svcData : []));
      setRuntimes(rtData?.items || (Array.isArray(rtData) ? rtData : []));
      setRoutes(routeData?.items || (Array.isArray(routeData) ? routeData : []));
      setVirtualModels(vmData?.items || (Array.isArray(vmData) ? vmData : []));
      if (svcData?.total != null) setSvcTotal(svcData.total);
      if (rtData?.total != null) setRtTotal(rtData.total);
      if (routeData?.total != null) setRouteTotal(routeData.total);
      if (vmData?.total != null) setVmTotal(vmData.total);
      if (initialServiceName) {
        const found = (svcData?.items || []).find(s => (s.metadata?.name || s.name) === initialServiceName);
        if (found) setSelectedService(found);
      }
    } catch (err) {
      setError(err.message || 'Failed to load inference data');
    } finally {
      setLoading(false);
    }
  }, [org, initialServiceName, svcLimit, svcOffset, rtLimit, rtOffset, routeLimit, routeOffset, vmLimit, vmOffset]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = useCallback(async (endpoint, closeFn, body) => {
    setCreateLoading(true);
    setCreateError(null);
    try {
      await createResource(org, endpoint, body);
      closeFn();
      await fetchData();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  }, [org, fetchData]);

  const confirmDelete = useCallback((type, item) => {
    setDeleteConfirm({ type, name: item.metadata?.name || item.name, item });
  }, []);

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    const { type, name } = deleteConfirm;
    setDeleteConfirm(null);
    try {
      const urls = {
        service: `/api/orgs/${org}/inference/services/${encodeURIComponent(name)}`,
        route: `/api/orgs/${org}/resources/KradleModelRoute/${encodeURIComponent(name)}`,
        'virtual-model': `/api/orgs/${org}/resources/KradleVirtualModel/${encodeURIComponent(name)}`,
      };
      const res = await fetch(urls[type], { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await fetchData();
    } catch (err) {
      setCreateError(err.message || 'Delete failed');
    }
  };

  const tabButtons = useMemo(() => [
    { key: 'services', label: 'Services' },
    { key: 'runtimes', label: 'Runtimes' },
    { key: 'routes', label: 'Model Routes' },
    { key: 'virtual-models', label: 'Virtual Models' },
  ], []);

  const createButtons = useMemo(() => ({
    services: { show: !showCreateForm, label: '+ Create Service', fn: () => setShowCreateForm(true) },
    runtimes: { show: !showRuntimeForm, label: '+ Add Runtime', fn: () => setShowRuntimeForm(true) },
    routes: { show: !showRouteForm, label: '+ Create Model Route', fn: () => setShowRouteForm(true) },
    'virtual-models': { show: !showVirtualModelForm, label: '+ Create Virtual Model', fn: () => setShowVirtualModelForm(true) },
  }), [showCreateForm, showRuntimeForm, showRouteForm, showVirtualModelForm]);

  const cb = createButtons[activeTab];

  return (
    <div style={{ fontFamily: 'inherit' }}>
      <CuratedModelCatalog org={org} services={services} onDeploy={fetchData} />
      <UnifiedModelCatalogSection org={org} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }} role="tablist" aria-label="Inference resource tabs">
          {tabButtons.map(({ key, label }) => (
            <button key={key} style={tabStyle(activeTab === key)} onClick={() => setActiveTab(key)} role="tab" aria-selected={activeTab === key} aria-label={`${label} tab`}>{label}</button>
          ))}
        </div>
        {cb?.show && <button style={btnStyle()} onClick={cb.fn}>{cb.label}</button>}
      </div>

      {error && (
        <div style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--danger) 35%, transparent)', borderRadius: 'var(--radius-md)', padding: '0.75rem', fontSize: '0.875rem', color: 'var(--danger)', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>Loading...</div>
      )}

      {!loading && activeTab === 'services' && (
        <ResourceTabContent
          items={services} total={svcTotal} limit={svcLimit} offset={svcOffset}
          onPageChange={setSvcOffset} onLimitChange={(l) => { setSvcLimit(l); setSvcOffset(0); }}
          showForm={showCreateForm} formTitle="Create Inference Service"
          createError={createError} createLoading={createLoading}
          FormComponent={CreateServiceForm} formProps={{ runtimes, onSubmit: (b) => handleCreate('services', () => setShowCreateForm(false), b) }}
          onShowForm={() => setShowCreateForm(true)} onHideForm={() => setShowCreateForm(false)} onClearError={() => setCreateError(null)}
          emptyTitle="No inference services" emptyText="Deploy a model to get started."
          renderCard={(svc, i) => <ServiceCard key={svc.metadata?.name || i} service={svc} onView={setSelectedService} onDelete={(s) => confirmDelete('service', s)} />}
        />
      )}

      {!loading && activeTab === 'runtimes' && (
        <ResourceTabContent
          items={runtimes} total={rtTotal} limit={rtLimit} offset={rtOffset}
          onPageChange={setRtOffset} onLimitChange={(l) => { setRtLimit(l); setRtOffset(0); }}
          showForm={showRuntimeForm} formTitle="Add Serving Runtime"
          createError={createError} createLoading={createLoading}
          FormComponent={CreateRuntimeForm} formProps={{ onSubmit: (b) => handleCreate('runtimes', () => setShowRuntimeForm(false), b) }}
          onShowForm={() => setShowRuntimeForm(true)} onHideForm={() => setShowRuntimeForm(false)} onClearError={() => setCreateError(null)}
          emptyTitle="No serving runtimes" emptyText="Add a custom serving runtime to use with your models."
          gridMinWidth="280px"
          renderCard={(rt, i) => <RuntimeCard key={rt.metadata?.name || i} runtime={rt} />}
        />
      )}

      {!loading && activeTab === 'routes' && (
        <ResourceTabContent
          items={routes} total={routeTotal} limit={routeLimit} offset={routeOffset}
          onPageChange={setRouteOffset} onLimitChange={(l) => { setRouteLimit(l); setRouteOffset(0); }}
          showForm={showRouteForm} formTitle="Create Model Route"
          createError={createError} createLoading={createLoading}
          FormComponent={CreateModelRouteForm} formProps={{ org, services, onSubmit: (b) => handleCreate('routes', () => setShowRouteForm(false), b) }}
          onShowForm={() => setShowRouteForm(true)} onHideForm={() => setShowRouteForm(false)} onClearError={() => setCreateError(null)}
          emptyTitle="No model routes" emptyText="Create a model route to map logical model names to internal services or external LLM endpoints."
          renderCard={(route, i) => <ModelRouteCard key={route.metadata?.name || i} route={route} onDelete={(r) => confirmDelete('route', r)} />}
        />
      )}

      {!loading && activeTab === 'virtual-models' && (
        <ResourceTabContent
          items={virtualModels} total={vmTotal} limit={vmLimit} offset={vmOffset}
          onPageChange={setVmOffset} onLimitChange={(l) => { setVmLimit(l); setVmOffset(0); }}
          showForm={showVirtualModelForm} formTitle="Create Virtual Model"
          createError={createError} createLoading={createLoading}
          FormComponent={CreateVirtualModelForm} formProps={{ routes, onSubmit: (b) => handleCreate('virtual-models', () => setShowVirtualModelForm(false), b) }}
          onShowForm={() => setShowVirtualModelForm(true)} onHideForm={() => setShowVirtualModelForm(false)} onClearError={() => setCreateError(null)}
          emptyTitle="No virtual models" emptyText="Create a virtual model to add programmable routing rules, hooks, and session management over your model routes."
          renderCard={(vm, i) => <VirtualModelCard key={vm.metadata?.name || i} vm={vm} onDelete={(v) => confirmDelete('virtual-model', v)} />}
        />
      )}

      {selectedService && (
        <ServiceDetailPanel service={selectedService} org={org} onClose={() => setSelectedService(null)} />
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        title={`Delete ${deleteConfirm?.type === 'virtual-model' ? 'virtual model' : deleteConfirm?.type || 'resource'}`}
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={executeDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
