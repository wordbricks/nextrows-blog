export const CATEGORIES = [
  'technology',
  'tutorials',
  'use-cases',
  'why-nextrows',
  'others',
] as const;

export type Category = typeof CATEGORIES[number];

const LABELS: Record<Category, string> = {
  technology: 'Technology',
  tutorials: 'Tutorials',
  'use-cases': 'Use Cases',
  'why-nextrows': 'Why NextRows',
  others: 'Others',
};

export const isCategory = (value: string): value is Category => {
  return (CATEGORIES as readonly string[]).includes(value);
};

const titleCase = (value: string) => {
  const s = value.replace(/-/g, ' ').trim();
  if (!s) return '';
  return s
    .split(' ')
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ');
};

export const getCategoryLabel = (value: string) => {
  if (isCategory(value)) return LABELS[value];
  return titleCase(value || '');
};

export const getCategoryColor = (value: string) => {
  switch (value) {
    case 'tutorials':
      return 'text-orange-600 dark:text-orange-400';
    case 'use-cases':
      return 'text-emerald-600 dark:text-emerald-400';
    case 'technology':
      return 'text-sky-600 dark:text-sky-400';
    case 'why-nextrows':
      return 'text-amber-600 dark:text-amber-400';
    case 'others':
      return 'text-purple-600 dark:text-purple-400';
    default:
      return 'text-stone-600';
  }
};
