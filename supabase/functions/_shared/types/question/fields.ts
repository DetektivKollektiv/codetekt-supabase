import {
  ChipAnswer,
  LikertScaleAnswer,
  MultyLineTextAnswer,
  TextAreaAnswer,
  TrafficLightAnswer,
} from "../answers-values.ts";
import { Condition } from "./condition.ts";
import {
  ChipOption,
  LikertScaleOption,
  MultiLineTextOption,
  TextAreaOption,
  TraficLightOption,
} from "./options.ts";

interface BaseField {
  id: string;
  is_disabled?: boolean | Condition[];
  is_required?: boolean | Condition[];
  is_shown?: boolean | Condition[];
  is_disputable?: boolean | Condition[];
}

export interface ChipField extends BaseField {
  type: "chip";
  question: string;
  options: ChipOption[];
  answer_value: ChipAnswer; // Multi-Select: Array von Option-IDs
}

export interface TraficLightField extends BaseField {
  type: "traffic-light";
  options: [TraficLightOption]; // Nur EINE Option pro Field
  answer_value: TrafficLightAnswer; // Single-Select: Ein Wert
}

export interface LikertScaleField extends BaseField {
  type: "likert-scale";
  question: string;
  options: LikertScaleOption[];
  answer_value: LikertScaleAnswer; // Single-Select: Ein Wert
}

export interface TextAreaField extends BaseField {
  type: "text-area";
  question: string;
  options: TextAreaOption[];
  answer_value: TextAreaAnswer; // Text-Input
}

export interface MultiLineTextField extends BaseField {
  type: "multi-line-text";
  question: string;
  options: MultiLineTextOption[];
  answer_value: MultyLineTextAnswer;
  additonal_option_count: number;
  max_length: number;
  placeholder: string;
}

export type Field =
  | ChipField
  | TraficLightField
  | LikertScaleField
  | TextAreaField
  | MultiLineTextField;
