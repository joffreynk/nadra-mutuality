export function isWithinExactHours(from: Date | string, hours = 48) {
    const then = new Date(from).getTime();
    return Date.now() <= then + hours * 60 * 60 * 1000;
  }

  export async function generatepharmacyReceipt(id : string) {
    // Implementation for generating pharmacy receipt
    try{
      await fetch(`/api/pharmacy/requests/${id}/receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error generating pharmacy receipt:', error); 
    }
  }

   export async function printReceipt(id: string) {
    const res = await fetch(`/api/pharmacy/requests/${id}/receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => res.statusText);
      throw new Error(txt || `Request failed: ${res.status}`);
    }
  }