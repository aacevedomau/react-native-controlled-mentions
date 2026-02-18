import React from "react";
import { TextInput, TextInputProps } from "react-native";
import { MentionInputProps } from "../types";
declare const MentionInput: <TInputProps extends TextInputProps = TextInputProps, TInputRef = TextInput>({ value, onChange, partTypes, inputRef: propInputRef, containerStyle, onSelectionChange, renderListSuggestions, renderListSelection, autoCompleteSuggestions, textInputComponent, ...textInputProps }: MentionInputProps<TInputProps, TInputRef>) => React.JSX.Element;
export { MentionInput };
