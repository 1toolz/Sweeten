export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description?: string;
  ingredients?: string;
  calories?: number;
  size?: string;
  options?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export type Category = string;
