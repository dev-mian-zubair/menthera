// Simple class variance authority replacement with better TypeScript support

type ClassValue = string | number | boolean | undefined | null;
type ClassArray = ClassValue[];
type ClassDict = Record<string, any>;
type ClassProp = ClassValue | ClassArray | ClassDict;

export function cn(...inputs: ClassProp[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string') {
      classes.push(input);
    } else if (Array.isArray(input)) {
      const inner = cn(...input);
      if (inner) classes.push(inner);
    } else if (typeof input === 'object') {
      for (const key in input) {
        if (input[key]) classes.push(key);
      }
    }
  }

  return classes.join(' ');
}

interface VariantConfig {
  variants?: Record<string, Record<string, string>>;
  defaultVariants?: Record<string, string | undefined>;
}

type VariantFunction = (props?: Record<string, any>) => string;

export type VariantProps<T extends VariantFunction> = Partial<{
  [K in keyof NonNullable<Parameters<T>[0]>]: NonNullable<Parameters<T>[0]>[K];
}>;

export function cva(
  base: string,
  config?: VariantConfig
): VariantFunction {
  return (props: Record<string, any> = {}) => {
    let classes = base;

    if (config?.variants) {
      Object.entries(config.variants).forEach(([variantName, variantValues]) => {
        const value = props[variantName] || config.defaultVariants?.[variantName];
        if (value && variantValues[value]) {
          classes += ` ${variantValues[value]}`;
        }
      });
    }

    if (props.className) {
      classes += ` ${props.className}`;
    }

    return classes;
  };
}