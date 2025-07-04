import type { Change } from "diff";
import type { FC, Ref } from "react";
import type {
  StyleProp,
  TextInput,
  TextInputProps,
  TextStyle,
  ViewStyle,
} from "react-native";

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

type CharactersDiffChange = Omit<Change, "count"> & { count: number };

type RegexMatchResult = string[] & {
  // Matched string
  0: string;

  // original
  1: string;

  // trigger
  2: string;

  // inner trigger (should match outer trigger)
  3: string;

  // title
  4: string;

  // id
  5: string;

  // Start position of matched text in whole string
  index: number;

  // Group titles (duplicates MentionData type)
  groups: MentionData;
};

// The same as text selection state
type Position = {
  start: number;
  end: number;
};

type MentionSuggestionsProps = {
  keyword: string | undefined;
  onSuggestionPress: (suggestion: Suggestion) => void;
  trigger?: string; // Add the active trigger
};

type MentionPartType = {
  // single trigger character eg '@' or '#'
  trigger: string;

  // Function for render suggestions
  // renderSuggestions?: (props: MentionSuggestionsProps) => ReactNode;

  // How much spaces are allowed for mention keyword
  allowedSpacesCount?: number;

  // Should we add a space after selected mentions if the mention is at the end of row
  isInsertSpaceAfterMention?: boolean;

  // Should we render either at the top or bottom of the input
  // isBottomMentionSuggestionsRender?: boolean;

  // Custom mention styles in text input
  textStyle?: StyleProp<TextStyle>;

  // Plain string generator for mention
  getPlainString?: (mention: MentionData) => string;
};

type PatternPartType = {
  // RexExp with global flag
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

type MentionInputProps = Omit<TextInputProps, "onChange"> & {
  value: string;
  onChange: (value: string) => any;

  partTypes?: PartType[];

  inputRef?: Ref<TextInput>;

  containerStyle?: StyleProp<ViewStyle>;

  renderListSuggestions: FC<MentionSuggestionsProps>;

  renderListSelection?: FC<Pick<MentionSuggestionsProps, "onSuggestionPress">>;

  // Auto-completion suggestions for each trigger
  autoCompleteSuggestions?: { [trigger: string]: Suggestion[] };
};

export type {
  Suggestion,
  MentionData,
  CharactersDiffChange,
  RegexMatchResult,
  Position,
  Part,
  MentionSuggestionsProps,
  MentionPartType,
  PatternPartType,
  PartType,
  MentionInputProps,
};
