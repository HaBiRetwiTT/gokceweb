import { ref } from 'vue';

export type Customer = { id: string; name: string; [key: string]: unknown };
export const selectedCustomer = ref<Customer | null>(null);
