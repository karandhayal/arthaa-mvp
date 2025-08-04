// In app/components/types.ts

export interface Rule {
  id: number;
  indicator?: string;
  // Parameters for the indicator itself
  period1?: number;
  period2?: number;
  
  condition?: string;
  
  // The value to compare against
  value_type?: 'number' | 'indicator';
  value_indicator?: string;
  value_number?: number;
  value_period1?: number;
  value_period2?: number;

  offset_type?: 'percentage' | 'value';
  offset_value?: number;
}

export interface RuleGroup {
  id: number;
  logic: 'AND' | 'OR';
  rules: (Rule | RuleGroup)[];
}
