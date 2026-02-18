import type { Change } from "diff";
import type { ComponentType, FC, Ref, RefAttributes } from "react";
import type { StyleProp, TextInput, TextInputProps, TextStyle, ViewStyle } from "react-native";
type Suggestion = {
    id: number;
    title: string;
};
type MentionData = {
    original: string;
    trigger: string;
    title: string;
    id: number;
};
type CharactersDiffChange = Omit<Change, "count"> & {
    count: number;
};
type RegexMatchResult = string[] & {
    0: string;
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    index: number;
    groups: MentionData;
};
type Position = {
    start: number;
    end: number;
};
type MentionSuggestionsProps = {
    keyword: string | undefined;
    onSuggestionPress: (suggestion: Suggestion) => void;
    trigger?: string;
};
type MentionPartType = {
    trigger: string;
    allowedSpacesCount?: number;
    isInsertSpaceAfterMention?: boolean;
    textStyle?: StyleProp<TextStyle>;
    getPlainString?: (mention: MentionData) => string;
};
type PatternPartType = {
    pattern: RegExp;
    textStyle?: StyleProp<TextStyle>;
};
type PartType = MentionPartType | PatternPartType;
type Part = {
    text: string;
    position: Position;
    partType?: PartType;
    data?: MentionData;
    cursorPosition?: number;
};
type MentionInputProps<TInputProps extends TextInputProps = TextInputProps, TInputRef = TextInput> = Omit<TInputProps, "onChange"> & {
    value: string;
    onChange: (value: string) => any;
    partTypes?: PartType[];
    inputRef?: Ref<TInputRef>;
    containerStyle?: StyleProp<ViewStyle>;
    textInputComponent?: ComponentType<TInputProps & RefAttributes<TInputRef>>;
    renderListSuggestions: FC<MentionSuggestionsProps>;
    renderListSelection?: FC<Pick<MentionSuggestionsProps, "onSuggestionPress">>;
    autoCompleteSuggestions?: {
        [trigger: string]: Suggestion[];
    };
};
export type { Suggestion, MentionData, CharactersDiffChange, RegexMatchResult, Position, Part, MentionSuggestionsProps, MentionPartType, PatternPartType, PartType, MentionInputProps, };
