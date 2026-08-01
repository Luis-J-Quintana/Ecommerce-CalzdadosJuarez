export type WholesaleTier = {
  quantity: number;
  pricePerUnit: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  image?: string; // vendrá de Medusa
  installments?: number; // meses sin intereses
  wholesaleTiers?: WholesaleTier[];
  isNew?: boolean;
};

export const products: Product[] = [
  {
    id: "292ar-negro",
    slug: "292ar-zapatilla-malla-negro",
    name: "292AR Zapatilla Malla Negro/Sintético Negro",
    price: 698.62,
    currency: "MXN",
    installments: 3,
    wholesaleTiers: [
      { quantity: 3, pricePerUnit: 516.98 },
      { quantity: 6, pricePerUnit: 440.13 },
      { quantity: 12, pricePerUnit: 398.21 },
      { quantity: 18, pricePerUnit: 349.31 },
    ],
    isNew: true,
  },
  {
    id: "292ar-beige",
    slug: "292ar-zapatilla-malla-beige",
    name: "292AR Zapatilla Malla Beige/Sintético Beige",
    price: 698.52,
    currency: "MXN",
    installments: 3,
    wholesaleTiers: [
      { quantity: 3, pricePerUnit: 516.98 },
      { quantity: 6, pricePerUnit: 440.13 },
      { quantity: 12, pricePerUnit: 398.21 },
      { quantity: 18, pricePerUnit: 349.31 },
    ],
    isNew: true,
  },
  {
    id: "292ar-cafe",
    slug: "292ar-zapatilla-malla-cafe",
    name: "292AR Zapatilla Malla Café/Sintético Café",
    price: 698.62,
    currency: "MXN",
    installments: 3,
    wholesaleTiers: [
      { quantity: 3, pricePerUnit: 516.98 },
      { quantity: 6, pricePerUnit: 440.13 },
      { quantity: 12, pricePerUnit: 398.21 },
      { quantity: 18, pricePerUnit: 349.31 },
    ],
    isNew: true,
  },
  {
    id: "310ar-blanco",
    slug: "310ar-sandalia-tiras-blanco",
    name: "310AR Sandalia de Tiras Blanco",
    price: 649.9,
    currency: "MXN",
    installments: 3,
    wholesaleTiers: [
      { quantity: 3, pricePerUnit: 489.9 },
      { quantity: 6, pricePerUnit: 419.9 },
      { quantity: 12, pricePerUnit: 379.9 },
      { quantity: 18, pricePerUnit: 339.9 },
    ],
    isNew: true,
  },
];