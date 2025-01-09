import type { Change } from 'diff';
import type { FC, Ref } from 'react';
import type { StyleProp, TextInput, TextInputProps, TextStyle, ViewStyle } from 'react-native';
declare type Suggestion = {
    id: number;
    title: string;
};
declare type MentionData = {
    original: string;
    trigger: string;
    title: string;
    id: number;
};
declare type CharactersDiffChange = Omit<Change, 'count'> & {
    count: number;
};
declare type RegexMatchResult = string[] & {
    0: string;
    1: string;
    2: string;
    3: string;
    4: number;
    index: number;
    groups: MentionData;
};
declare type Position = {
    start: number;
    end: number;
};
declare type MentionSuggestionsProps = {
    keyword: string | undefined;
    onSuggestionPress: (suggestion: Suggestion) => void;
};
declare type MentionPartType = {
    trigger: string;
    allowedSpacesCount?: number;
    isInsertSpaceAfterMention?: boolean;
    textStyle?: StyleProp<TextStyle>;
    getPlainString?: (mention: MentionData) => string;
};
declare type PatternPartType = {
    pattern: RegExp;
    textStyle?: StyleProp<TextStyle>;
};
declare type PartType = MentionPartType | PatternPartType;
declare type Part = {
    text: string;
    position: Position;
    partType?: PartType;
    data?: MentionData;
};
declare type MentionInputProps = Omit<TextInputProps, 'onChange'> & {
    value: string;
    onChange: (value: string) => any;
    partTypes?: PartType[];
    inputRef?: Ref<TextInput>;
    containerStyle?: StyleProp<ViewStyle>;
    renderListSuggestions: FC<MentionSuggestionsProps>;
    renderListSelection?: FC<Pick<MentionSuggestionsProps, 'onSuggestionPress'>>;
};
export type { Suggestion, MentionData, CharactersDiffChange, RegexMatchResult, Position, Part, MentionSuggestionsProps, MentionPartType, PatternPartType, PartType, MentionInputProps, };
