// In app/components/types.ts

export interface Rule {
  id: number;
  indicator?: string;
  condition?: string;
  value?: string;
  offset_type?: 'percentage' | 'value';
  offset_value?: number;
}

export interface RuleGroup {
  id: number;
  logic: 'AND' | 'OR';
  rules: (Rule | RuleGroup)[];
}
