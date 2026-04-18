import { create } from 'zustand';

const useCartStore = create((set) => ({
  itemCount: 0,
  setItemCount: (count) => set({ itemCount: count }),
  incrementCount: (amount = 1) =>
    set((state) => ({ itemCount: state.itemCount + amount })),
  decrementCount: (amount = 1) =>
    set((state) => ({ itemCount: Math.max(0, state.itemCount - amount) })),
  resetCount: () => set({ itemCount: 0 }),
}));

export default useCartStore;
