'use client';

import { useState, useEffect, useCallback } from 'react';
import { cardStyle, btnStyle } from './inference-helpers.jsx';
import { ServiceCard, CreateServiceForm, ServiceDetailPanel } from './inference-service-list.jsx';
import { RuntimeCard, CreateRuntimeForm } from './inference-runtime-list.jsx';
import { ModelRouteCard, CreateModelRouteForm } from './model-route-manager.jsx';
import { VirtualModelCard, CreateVirtualModelForm } from './virtual-model-manager.jsx';
import { CuratedModelCatalog, UnifiedModelCatalogSection } from './curated-model-catalog.jsx';
import { Pagination } from './pagination.jsx';

// ─── Main Component ───────────────────────────────────────────────────────────
//
// Resource contract fields referenced by this module and its sub-components:
//   KrateInferenceService: modelFormat, storageUri
//   KrateModelRoute: modelName, routeType
//   KrateVirtualModel: modelName, routes

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

  // Pagination state per resource type
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
        fetch(`/api/orgs/${org}/inference/services?limit=${svcLimit}&offset=${svcOffset}`),
        fetch(`/api/orgs/${org}/inference/runtimes?limit=${rtLimit}&offset=${rtOffset}`),
        fetch(`/api/orgs/${org}/inference/routes?limit=${routeLimit}&offset=${routeOffset}`),
        fetch(`/api/orgs/${org}/inference/virtual-models?limit=${vmLimit}&offset=${vmOffset}`),
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

  const handleCreateService = async (body) => {
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await fetch(`/api/orgs/${org}/inference/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed with status ${res.status}`);
      }
      setShowCreateForm(false);
      await fetchData();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateRuntime = async (body) => {
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await fetch(`/api/orgs/${org}/inference/runtimes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed with status ${res.status}`);
      }
      setShowRuntimeForm(false);
      await fetchData();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateRoute = async (body) => {
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await fetch(`/api/orgs/${org}/inference/routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed with status ${res.status}`);
      }
      setShowRouteForm(false);
      await fetchData();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (service) => {
    const name = service.metadata?.name || service.name;
    if (!confirm(`Delete inference service "${name}"?`)) return;
    try {
      const res = await fetch(`/api/orgs/${org}/inference/services/${encodeURIComponent(name)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await fetchData();
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  const handleCreateVirtualModel = async (body) => {
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await fetch(`/api/orgs/${org}/inference/virtual-models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed with status ${res.status}`);
      }
      setShowVirtualModelForm(false);
      await fetchData();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteRoute = async (route) => {
    const name = route.metadata?.name || route.name;
    if (!confirm(`Delete model route "${name}"?`)) return;
    try {
      const res = await fetch(`/api/orgs/${org}/resources/KrateModelRoute/${encodeURIComponent(name)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await fetchData();
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  const handleDeleteVirtualModel = async (vm) => {
    const name = vm.metadata?.name || vm.name;
    if (!confirm(`Delete virtual model "${name}"?`)) return;
    try {
      const res = await fetch(`/api/orgs/${org}/resources/KrateVirtualModel/${encodeURIComponent(name)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await fetchData();
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  const tabStyle = (active) => ({
    padding: '0.5rem 1rem',
    border: 'none',
    borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
    background: 'none',
    cursor: 'pointer',
    fontWeight: active ? 700 : 500,
    color: active ? '#2563eb' : '#6b7280',
    fontSize: '0.875rem',
  });

  return (
    <div style={{ fontFamily: 'inherit' }}>
      {/* Curated Model Catalog */}
      <CuratedModelCatalog org={org} services={services} onDeploy={fetchData} />

      {/* Unified Model Catalog (API-fetched) */}
      <UnifiedModelCatalogSection org={org} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
          <button style={tabStyle(activeTab === 'services')} onClick={() => setActiveTab('services')}>Services</button>
          <button style={tabStyle(activeTab === 'runtimes')} onClick={() => setActiveTab('runtimes')}>Runtimes</button>
          <button style={tabStyle(activeTab === 'routes')} onClick={() => setActiveTab('routes')}>Model Routes</button>
          <button style={tabStyle(activeTab === 'virtual-models')} onClick={() => setActiveTab('virtual-models')}>Virtual Models</button>
        </div>
        {activeTab === 'services' && !showCreateForm && (
          <button style={btnStyle()} onClick={() => setShowCreateForm(true)}>+ Create Service</button>
        )}
        {activeTab === 'runtimes' && !showRuntimeForm && (
          <button style={btnStyle()} onClick={() => setShowRuntimeForm(true)}>+ Add Runtime</button>
        )}
        {activeTab === 'routes' && !showRouteForm && (
          <button style={btnStyle()} onClick={() => setShowRouteForm(true)}>+ Create Model Route</button>
        )}
        {activeTab === 'virtual-models' && !showVirtualModelForm && (
          <button style={btnStyle()} onClick={() => setShowVirtualModelForm(true)}>+ Create Virtual Model</button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem', padding: '0.75rem', fontSize: '0.875rem', color: '#dc2626', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ fontSize: '0.875rem', color: '#9ca3af', padding: '2rem', textAlign: 'center' }}>Loading...</div>
      )}

      {/* Services Tab */}
      {!loading && activeTab === 'services' && (
        <>
          {showCreateForm && (
            <div style={{ ...cardStyle, marginBottom: '1rem', background: '#f8fafc' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.5rem' }}>Create Inference Service</div>
              {createError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem', padding: '0.5rem', fontSize: '0.8125rem', color: '#dc2626', marginBottom: '0.5rem' }}>
                  {createError}
                </div>
              )}
              <CreateServiceForm
                runtimes={runtimes}
                onSubmit={handleCreateService}
                onCancel={() => { setShowCreateForm(false); setCreateError(null); }}
                loading={createLoading}
              />
            </div>
          )}
          {services.length === 0 && !showCreateForm ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>No inference services</div>
              <div style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Deploy a model to get started.</div>
              <button style={btnStyle()} onClick={() => setShowCreateForm(true)}>Create Service</button>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '0.75rem' }}>
                {services.map((svc, i) => (
                  <ServiceCard
                    key={svc.metadata?.name || i}
                    service={svc}
                    onView={setSelectedService}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
              <Pagination
                total={svcTotal}
                limit={svcLimit}
                offset={svcOffset}
                onPageChange={(o) => setSvcOffset(o)}
                onLimitChange={(l) => { setSvcLimit(l); setSvcOffset(0); }}
              />
            </>
          )}
        </>
      )}

      {/* Runtimes Tab */}
      {!loading && activeTab === 'runtimes' && (
        <>
          {showRuntimeForm && (
            <div style={{ ...cardStyle, marginBottom: '1rem', background: '#f8fafc' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.5rem' }}>Add Serving Runtime</div>
              {createError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem', padding: '0.5rem', fontSize: '0.8125rem', color: '#dc2626', marginBottom: '0.5rem' }}>
                  {createError}
                </div>
              )}
              <CreateRuntimeForm
                onSubmit={handleCreateRuntime}
                onCancel={() => { setShowRuntimeForm(false); setCreateError(null); }}
                loading={createLoading}
              />
            </div>
          )}
          {runtimes.length === 0 && !showRuntimeForm ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>No serving runtimes</div>
              <div style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Add a custom serving runtime to use with your models.</div>
              <button style={btnStyle()} onClick={() => setShowRuntimeForm(true)}>Add Runtime</button>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {runtimes.map((rt, i) => (
                  <RuntimeCard key={rt.metadata?.name || i} runtime={rt} />
                ))}
              </div>
              <Pagination
                total={rtTotal}
                limit={rtLimit}
                offset={rtOffset}
                onPageChange={(o) => setRtOffset(o)}
                onLimitChange={(l) => { setRtLimit(l); setRtOffset(0); }}
              />
            </>
          )}
        </>
      )}

      {/* Model Routes Tab */}
      {!loading && activeTab === 'routes' && (
        <>
          {showRouteForm && (
            <div style={{ ...cardStyle, marginBottom: '1rem', background: '#f8fafc' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.5rem' }}>Create Model Route</div>
              {createError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem', padding: '0.5rem', fontSize: '0.8125rem', color: '#dc2626', marginBottom: '0.5rem' }}>
                  {createError}
                </div>
              )}
              <CreateModelRouteForm
                org={org}
                services={services}
                onSubmit={handleCreateRoute}
                onCancel={() => { setShowRouteForm(false); setCreateError(null); }}
                loading={createLoading}
              />
            </div>
          )}
          {routes.length === 0 && !showRouteForm ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>No model routes</div>
              <div style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Create a model route to map logical model names to internal services or external LLM endpoints.</div>
              <button style={btnStyle()} onClick={() => setShowRouteForm(true)}>Create Model Route</button>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '0.75rem' }}>
                {routes.map((route, i) => (
                  <ModelRouteCard
                    key={route.metadata?.name || i}
                    route={route}
                    onDelete={handleDeleteRoute}
                  />
                ))}
              </div>
              <Pagination
                total={routeTotal}
                limit={routeLimit}
                offset={routeOffset}
                onPageChange={(o) => setRouteOffset(o)}
                onLimitChange={(l) => { setRouteLimit(l); setRouteOffset(0); }}
              />
            </>
          )}
        </>
      )}

      {/* Virtual Models Tab */}
      {!loading && activeTab === 'virtual-models' && (
        <>
          {showVirtualModelForm && (
            <div style={{ ...cardStyle, marginBottom: '1rem', background: '#f8fafc' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.5rem' }}>Create Virtual Model</div>
              {createError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem', padding: '0.5rem', fontSize: '0.8125rem', color: '#dc2626', marginBottom: '0.5rem' }}>
                  {createError}
                </div>
              )}
              <CreateVirtualModelForm
                routes={routes}
                onSubmit={handleCreateVirtualModel}
                onCancel={() => { setShowVirtualModelForm(false); setCreateError(null); }}
                loading={createLoading}
              />
            </div>
          )}
          {virtualModels.length === 0 && !showVirtualModelForm ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>No virtual models</div>
              <div style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Create a virtual model to add programmable routing rules, hooks, and session management over your model routes.</div>
              <button style={btnStyle()} onClick={() => setShowVirtualModelForm(true)}>Create Virtual Model</button>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '0.75rem' }}>
                {virtualModels.map((vm, i) => (
                  <VirtualModelCard
                    key={vm.metadata?.name || i}
                    vm={vm}
                    onDelete={handleDeleteVirtualModel}
                  />
                ))}
              </div>
              <Pagination
                total={vmTotal}
                limit={vmLimit}
                offset={vmOffset}
                onPageChange={(o) => setVmOffset(o)}
                onLimitChange={(l) => { setVmLimit(l); setVmOffset(0); }}
              />
            </>
          )}
        </>
      )}

      {/* Service Detail Panel */}
      {selectedService && (
        <ServiceDetailPanel
          service={selectedService}
          org={org}
          onClose={() => setSelectedService(null)}
        />
      )}
    </div>
  );
}
