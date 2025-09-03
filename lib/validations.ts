// lib/validators.pharmacy.ts
import { z } from 'zod';

export const PharmacyItemCreate = z.object({
  mdecineName: z.string().min(1, 'Medicine name required'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be >= 1'),
  unitPrice: z.coerce.number().nullable(),
});

export const CreatePharmacyRequestBody = z.object({
  memberId: z.string().min(1),
  items: z.array(PharmacyItemCreate).min(1, 'At least one medicine required'),
});

export const PharmacyItemUpdate = PharmacyItemCreate.extend({
  id: z.string().optional(),
  status: z.string().optional(),
});

export const UpdatePharmacyRequestBody = z.object({
  items: z.array(PharmacyItemUpdate).min(1, 'At least one item required'),
});

export const ItemStatusAction = z.object({
  action: z.enum(['Approved', 'Reverted']),
  note: z.string().optional(),
  unitPrice: z.coerce.number().nonnegative('Unit price must be >= 0').nullable().optional(),
});
