interface BaseCondition {
  field_id: string;
}

interface ComparisonCondition extends BaseCondition {
  operator: ">" | "<";
  value: number;
}

interface EqualsCondition extends BaseCondition {
  operator: "equals";
  value: string | number | boolean;
}

export type Condition =
  | ComparisonCondition
  | EqualsCondition;
