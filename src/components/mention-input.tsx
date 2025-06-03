import React, { MutableRefObject, useMemo, useRef, useState } from "react";
import {
  NativeSyntheticEvent,
  Text,
  TextInput,
  TextInputSelectionChangeEventData,
  View,
} from "react-native";

import { MentionInputProps, MentionPartType, Suggestion } from "../types";
import {
  defaultMentionTextStyle,
  generateValueFromPartsAndChangedText,
  generateValueWithAddedSuggestion,
  getMentionPartSuggestionKeywords,
  parseValue,
} from "../utils";

const MentionInput = ({
  value,
  onChange,
  partTypes = [],
  inputRef: propInputRef,
  containerStyle,
  onSelectionChange,
  renderListSuggestions,
  renderListSelection,
  ...textInputProps
}: MentionInputProps) => {
  const textInput = useRef<TextInput | null>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const { plainText, parts } = useMemo(
    () => parseValue(value, partTypes),
    [value, partTypes]
  );

  const handleSelectionChange = (
    event: NativeSyntheticEvent<TextInputSelectionChangeEventData>
  ) => {
    setSelection(event.nativeEvent.selection);
    onSelectionChange?.(event);
  };

  const onChangeInput = (changedText: string) => {
    onChange(
      generateValueFromPartsAndChangedText(parts, plainText, changedText)
    );
  };

  const keywordByTrigger = useMemo(() => {
    return getMentionPartSuggestionKeywords(
      parts,
      plainText,
      selection,
      partTypes
    );
  }, [parts, plainText, selection, partTypes]);

  const onSuggestionPress =
    (mentionType: MentionPartType, isSuggestion = true) =>
    (suggestion: Suggestion) => {
      const currentCursorPosition = selection.start;
      console.log(
        "Current cursor position:",
        JSON.stringify(selection),
        `- ${suggestion.title}`
      );
      console.log("parts:", parts);
      console.log("plainText:", plainText);
      console.log("keywordByTrigger:", keywordByTrigger);
      console.log("mentionType:", mentionType);
      console.log("isSuggestion:", isSuggestion);
      console.log("suggestion:", suggestion);

      const newValue = generateValueWithAddedSuggestion(
        parts,
        mentionType,
        plainText,
        selection,
        suggestion,
        isSuggestion
      );

      if (!newValue) return;

      onChange(newValue);

      console.log("New value:", newValue);

      let nextCursor = 1;
      if (!isSuggestion)
        nextCursor += currentCursorPosition + suggestion.title.length + 1;
      else {
        nextCursor +=
          currentCursorPosition +
          suggestion.title.length -
          (keywordByTrigger && keywordByTrigger["#"]
            ? keywordByTrigger["#"].length
            : 0);
      }
      console.log("3- Next cursor position:", nextCursor);

      setTimeout(() => {
        setSelection({ start: nextCursor, end: nextCursor });
      }, 1000);
    };

  const handleTextInputRef = (ref: TextInput) => {
    textInput.current = ref;

    if (propInputRef) {
      if (typeof propInputRef === "function") {
        propInputRef(ref);
      } else {
        (propInputRef as MutableRefObject<TextInput>).current = ref;
      }
    }
  };

  return (
    <>
      {renderListSelection?.({
        onSuggestionPress: onSuggestionPress(
          partTypes[0] as MentionPartType,
          false
        ),
      })}
      <View style={containerStyle}>
        <TextInput
          multiline
          {...textInputProps}
          ref={handleTextInputRef}
          onChangeText={onChangeInput}
          onSelectionChange={handleSelectionChange}
          selection={selection}
        >
          <Text>
            {parts.map(({ text, partType, data }, index) =>
              partType ? (
                <Text
                  key={`${index}-${data?.trigger ?? "pattern"}`}
                  style={partType.textStyle ?? defaultMentionTextStyle}
                >
                  {text}
                </Text>
              ) : (
                <Text key={index}>{text}</Text>
              )
            )}
          </Text>
        </TextInput>

        {renderListSuggestions({
          keyword: keywordByTrigger["#"],
          onSuggestionPress: onSuggestionPress(partTypes[0] as MentionPartType),
        })}
      </View>
    </>
  );
};

export { MentionInput };
