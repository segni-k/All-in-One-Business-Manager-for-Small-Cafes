export interface AvatarOption {
  id: string;
  label: string;
  url: string;
}

export const USER_AVATAR_OPTIONS: AvatarOption[] = [
  { id: "u1", label: "Barista 1", url: "https://api.dicebear.com/9.x/adventurer/svg?seed=barista-1" },
  { id: "u2", label: "Barista 2", url: "https://api.dicebear.com/9.x/adventurer/svg?seed=barista-2" },
  { id: "u3", label: "Manager 1", url: "https://api.dicebear.com/9.x/adventurer/svg?seed=manager-1" },
  { id: "u4", label: "Manager 2", url: "https://api.dicebear.com/9.x/adventurer/svg?seed=manager-2" },
  { id: "u5", label: "Cafe 1", url: "https://api.dicebear.com/9.x/bottts/svg?seed=cafe-1" },
  { id: "u6", label: "Cafe 2", url: "https://api.dicebear.com/9.x/bottts/svg?seed=cafe-2" },
];

export const PRODUCT_AVATAR_OPTIONS: AvatarOption[] = [
  { id: "p1", label: "Coffee", url: "https://api.dicebear.com/9.x/shapes/svg?seed=coffee-product" },
  { id: "p2", label: "Tea", url: "https://api.dicebear.com/9.x/shapes/svg?seed=tea-product" },
  { id: "p3", label: "Snack", url: "https://api.dicebear.com/9.x/shapes/svg?seed=snack-product" },
  { id: "p4", label: "Dessert", url: "https://api.dicebear.com/9.x/shapes/svg?seed=dessert-product" },
  { id: "p5", label: "Juice", url: "https://api.dicebear.com/9.x/shapes/svg?seed=juice-product" },
  { id: "p6", label: "Special", url: "https://api.dicebear.com/9.x/shapes/svg?seed=special-product" },
];
