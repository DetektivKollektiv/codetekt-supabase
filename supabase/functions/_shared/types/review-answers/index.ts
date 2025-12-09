import {
    ChipAnswer,
    LikertScaleAnswer,
    MultyLineTextAnswer,
    TextAreaAnswer,
    TrafficLightAnswer,
} from "../answers-values.ts";

export interface ReviewAnswers {
    [key: string]:
        | MultyLineTextAnswer
        | ChipAnswer
        | TrafficLightAnswer
        | LikertScaleAnswer
        | TextAreaAnswer;
}
