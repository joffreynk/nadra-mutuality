'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
// Precise types for API responses
type Member = { id: string; name: string };
type Service = { id: string; name: string; price?: number; };

type TreatmentItem = { id?: string; hospitalServiceId?: string; quantity: number; unitPrice?: number };
type Treatment = { id: string; createdAt: string; items: TreatmentItem[]; memberId?: string };

// API response shapes (adapt if your API differs)
type MembersResponse = Member[];
type ServicesResponse = Service[];
type TreatmentsResponse = Treatment[];
type CreateServiceResponse = Service;
type CreateTreatmentResponse = Treatment;

export default function TreatmentsClient() {
  // data
  const [members, setMembers] = useState<Member[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [list, setList] = useState<Treatment[]>([]);

  // form
  const [memberId, setMemberId] = useState('');
  const [items, setItems] = useState<TreatmentItem[]>([{ hospitalServiceId: '', quantity: 1, unitPrice: 0 }]);
  const [serviceQuery, setServiceQuery] = useState('');
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState<number | undefined>(undefined); // New state for price of new service
  const [selectedService, setSelectedService] = useState<Service | null>(null); // New state for selected service

  // loading & error states
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const [treatmentsLoading, setTreatmentsLoading] = useState(false);
  const [treatmentsError, setTreatmentsError] = useState<string | null>(null);

  const [createTreatmentLoading, setCreateTreatmentLoading] = useState(false);
  const [createTreatmentError, setCreateTreatmentError] = useState<string | null>(null);

  const [createServiceLoading, setCreateServiceLoading] = useState(false);
  const [createServiceError, setCreateServiceError] = useState<string | null>(null);

  const router = useRouter(); // Initialize useRouter

  const debounceRef = useRef<number | null>(null);
  const lastQueryRef = useRef('');

  // --- typed fetch helpers ---
  async function fetchMembers(): Promise<MembersResponse> {
    const res = await fetch('/api/members');
    if (!res.ok) throw new Error(`Members fetch failed: ${res.status}`);
    return res.json();
  }

  async function fetchServices(q?: string): Promise<ServicesResponse> {
    const url = q ? `/api/hospital/services?search=${encodeURIComponent(q)}` : '/api/hospital/services';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Services fetch failed: ${res.status}`);
    return res.json();
  }

  async function fetchTreatments(): Promise<TreatmentsResponse> {
    const res = await fetch('/api/hospital/treatments');
    if (!res.ok) throw new Error(`Treatments fetch failed: ${res.status}`);
    return res.json();
  }

  async function postCreateService(payload: { name: string; price?: number }): Promise<CreateServiceResponse> {
    const res = await fetch('/api/hospital/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(`Create service failed: ${res.status}`);
    return res.json();
  }

  async function postCreateTreatment(payload: { memberId: string; items: Array<{ hospitalServiceId: string; quantity: number; unitPrice?: number }> }): Promise<CreateTreatmentResponse> {
    const res = await fetch('/api/hospital/treatments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(`Create treatment failed: ${res.status}`);
    return res.json();
  }

  // --- initial load ---
  useEffect(() => {
    (async () => {
      // members
      setMembersLoading(true);
      setMembersError(null);
      try {
        const m = await fetchMembers();
        setMembers(m.map((x) => ({ id: x.id, name: x.name })));
      } catch (err: any) {
        setMembersError(err?.message ?? 'Unknown error');
      } finally {
        setMembersLoading(false);
      }

      // services
      setServicesLoading(true);
      setServicesError(null);
      try {
        const s = await fetchServices();
        setServices(s);
      } catch (err: any) {
        setServicesError(err?.message ?? 'Unknown error');
      } finally {
        setServicesLoading(false);
      }

      // treatments
      setTreatmentsLoading(true);
      setTreatmentsError(null);
      try {
        const t = await fetchTreatments();
        setList(t);
      } catch (err: any) {
        setTreatmentsError(err?.message ?? 'Unknown error');
      } finally {
        setTreatmentsLoading(false);
      }
    })();
  }, []);

  // --- debounced search ---
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = serviceQuery.trim();
    if (!q) {
      // Optionally reload base services or clear suggestions
      // setServices([]);
      setNewServiceName('');
      setNewServicePrice(undefined);
      return;
    }
    lastQueryRef.current = q;
    debounceRef.current = window.setTimeout(async () => {
      try {
        const svc = await fetchServices(q);
        // Only update if the query hasn't changed during debounce
        if (lastQueryRef.current === q) {
          setServices(svc);
        }
      } catch (err: any) {
        if (lastQueryRef.current === q) {
          setSearchError(err?.message ?? 'Search failed');
        }
      } finally {
        if (lastQueryRef.current === q) {
          setSearchLoading(false);
        }
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [serviceQuery]);

  // helper to immutably update an item
  const updateItem = (idx: number, key: keyof TreatmentItem, value: any) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [key]: value } : item))
    );
  };

  // create treatment flow
  async function createTreatment(e: React.FormEvent) {
    e.preventDefault();
    setCreateTreatmentLoading(true);
    setCreateTreatmentError(null);

    try {
      // prepare payload from items
      const payloadItems = items.map((i) => ({
        hospitalServiceId: i.hospitalServiceId || '',
        quantity: i.quantity,
        unitPrice: i.unitPrice ?? 0,
      }));

      const payload = { memberId, items: payloadItems };

      const newTreatment = await postCreateTreatment(payload);
      // reset form on success
      setMemberId('');
      setItems([{ hospitalServiceId: '', quantity: 1, unitPrice: 0 }]); // Reset to a single empty item
      setServiceQuery('');
      setNewServiceName('');
      setNewServicePrice(undefined);
      setSelectedService(null);
      setList((prev) => [newTreatment, ...prev]);
    } catch (err: any) {
      setCreateTreatmentError(err?.message ?? 'Failed to create treatment');
    } finally {
      setCreateTreatmentLoading(false);
    }
  }

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  // Handle adding a new service or selecting an existing one
  const handleAddService = async () => {
    if (selectedService) {
      setItems((prev) => [...prev, { hospitalServiceId: selectedService.id, quantity: 1, unitPrice: selectedService.price ?? 0 }]);
      setServiceQuery('');
      setSelectedService(null);
      setNewServiceName(''); // Clear new service name after adding selected
      setNewServicePrice(undefined); // Clear new service price after adding selected
    } else if (newServiceName.trim() !== '') {
      setCreateServiceError(null);
      setCreateServiceLoading(true);
      try {
        const sv = await postCreateService({ name: newServiceName, price: newServicePrice });
        setServices((prev) => [sv, ...prev]); // Add newly created service to the list
        setItems((prev) => [...prev, { hospitalServiceId: sv.id, quantity: 1, unitPrice: sv.price ?? 0 }]);
        setNewServiceName('');
        setNewServicePrice(undefined);
        setServiceQuery(''); // Clear search query after adding new service
      } catch (err: any) {
        setCreateServiceError(err.message);
      } finally {
        setCreateServiceLoading(false);
      }
    } else {
      // Optionally, add an empty item if nothing is selected or typed
      setItems((prev) => [...prev, { hospitalServiceId: '', quantity: 1, unitPrice: 0 }]);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Treatment Records</h1>

        <form onSubmit={createTreatment} className="bg-white p-6 rounded border shadow space-y-4">
          <div>
            <label className="block text-sm font-medium">Member</label>
            {membersLoading ? (
              <div className="text-sm text-muted">Loading members...</div>
            ) : membersError ? (
              <div className="text-sm text-red-600">{membersError}</div>
            ) : (
              <select className="w-full border rounded p-2" value={memberId} onChange={(e) => setMemberId(e.target.value)} required>
                <option value="">Select...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-2">
            <label className="font-medium text-sm">Add Service</label>
            <div className="flex flex-col gap-2 relative">
              <input
                type="text"
                className="border rounded p-2 w-full"
                placeholder="Search or type service name"
                value={serviceQuery}
                onChange={(e) => {
                  setServiceQuery(e.target.value);
                  setSelectedService(null); // Clear selection on typing
                }}
                onBlur={() => {
                  // If user types and then blurs, assume it's a new service name if no selection
                  if (!selectedService && serviceQuery.trim() !== '') {
                    setNewServiceName(serviceQuery.trim());
                  } else {
                    setNewServiceName('');
                    setNewServicePrice(undefined);
                  }
                }}
              />
              {selectedService ? (
                <div className="border rounded p-2 bg-gray-100 flex items-center justify-between w-full">
                  <span>Selected: {selectedService.name} - ${selectedService.price?.toFixed(2) ?? 'N/A'}</span>
                  <button type="button" className="text-red-500" onClick={() => setSelectedService(null)}>x</button>
                </div>
              ) : serviceQuery.trim() !== '' && services.length > 0 ? (
                <div className="absolute z-10 bg-white border rounded shadow-md mt-1 top-full left-0 w-full max-h-60 overflow-y-auto">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="p-2 cursor-pointer hover:bg-gray-200"
                      onMouseDown={(e) => {
                        // Use onMouseDown to prevent onBlur from firing before onClick
                        e.preventDefault();
                        setSelectedService(service);
                        setServiceQuery(service.name);
                        setNewServiceName('');
                        setNewServicePrice(undefined);
                      }}
                    >
                      {service.name} (${service.price?.toFixed(2) ?? 'N/A'})
                    </div>
                  ))}
                </div>
              ) : serviceQuery.trim() !== '' && services.length === 0 ? (
                <div className="flex flex-col gap-2 mt-2 w-full">
                  <p className="text-sm text-gray-600">Service not found. Enter details for a new service:</p>
                  <input
                    type="number"
                    placeholder="New Service Price (optional)"
                    className="border rounded p-2 w-full"
                    value={newServicePrice ?? ''}
                    onChange={(e) => setNewServicePrice(e.target.value === '' ? undefined : Number(e.target.value))}
                  />
                </div>
              ) : null}

            </div>
            <button type="button" className="px-4 py-2 bg-brand text-white rounded self-end mt-2" disabled={createServiceLoading} onClick={handleAddService}>
              {createServiceLoading ? 'Adding Service...' : 'Add Service'}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm">Items</label>
            {items.length === 0 ? (
              <p className="text-sm text-gray-600">No services added yet. Add a service above.</p>
            ) : (
              items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2 items-center">
                  <span className="col-span-2">{services.find(s => s.id === item.hospitalServiceId)?.name}</span>
                  <input
                    type="number"
                    className="border rounded p-2"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                  />
                  <input
                    type="number"
                    className="border rounded p-2"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                  />
                  <button type="button" className="text-red-500" onClick={() => removeItem(idx)}>Remove</button>
                </div>
              ))
            )}
          </div>

          {createTreatmentError && <div className="text-sm text-red-600">{createTreatmentError}</div>}

          <div className="flex gap-2 justify-end mt-4">
            <button type="button" className="px-4 py-2 border rounded" onClick={() => router.back()}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand text-white rounded" disabled={createTreatmentLoading || items.length === 0}>
              {createTreatmentLoading ? 'Saving...' : 'Save Treatment'}
            </button>
          </div>
        </form>

        <div className="bg-white p-6 rounded border shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Treatments</h2>

          {treatmentsLoading ? (
            <div className="text-sm">Loading treatments...</div>
          ) : treatmentsError ? (
            <div className="text-sm text-red-600">{treatmentsError}</div>
          ) : (
            <div className="space-y-2 text-sm">
              {list.map((t) => (
                <div key={t.id} className="border rounded p-3">
                  <div className="font-medium">{t.id?.slice(0, 8)} • {new Date(t.createdAt).toLocaleString()}</div>
                  <div>Items: {t.items?.length ?? 0}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
