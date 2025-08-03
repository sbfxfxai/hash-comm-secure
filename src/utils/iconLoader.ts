// Dynamic icon loader to reduce initial bundle size
// Only load icons that are actually used

import { lazy, ComponentType } from 'react';
import { LucideProps } from 'lucide-react';

// Essential icons loaded immediately
export { 
  Bitcoin, 
  Shield, 
  Zap, 
  Users, 
  LogOut, 
  User,
  Menu,
  Home,
  Search
} from 'lucide-react';

// Lazy load less critical icons
const iconCache = new Map<string, ComponentType<LucideProps>>();

export const loadIcon = async (iconName: string): Promise<ComponentType<LucideProps>> => {
  if (iconCache.has(iconName)) {
    return iconCache.get(iconName)!;
  }

  try {
    const iconModule = await import('lucide-react');
    const IconComponent = (iconModule as any)[iconName];
    
    if (IconComponent) {
      iconCache.set(iconName, IconComponent);
      return IconComponent;
    }
  } catch (error) {
    console.warn(`Failed to load icon: ${iconName}`);
  }

  // Fallback to a default icon
  const { Circle } = await import('lucide-react');
  return Circle;
};

// Lazy icon component wrapper
export const LazyIcon = lazy(async ({ name, ...props }: { name: string } & LucideProps) => {
  const IconComponent = await loadIcon(name);
  return { default: () => <IconComponent {...props} /> };
});
