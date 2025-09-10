"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MentionInput = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const utils_1 = require("../utils");
const MentionInput = (_a) => {
    var { value, onChange, partTypes = [], inputRef: propInputRef, containerStyle, onSelectionChange, renderListSuggestions, renderListSelection, autoCompleteSuggestions = {} } = _a, textInputProps = __rest(_a, ["value", "onChange", "partTypes", "inputRef", "containerStyle", "onSelectionChange", "renderListSuggestions", "renderListSelection", "autoCompleteSuggestions"]);
    const textInput = (0, react_1.useRef)(null);
    const [selection, setSelection] = (0, react_1.useState)({ start: 0, end: 0 });
    const { plainText, parts } = (0, react_1.useMemo)(() => (0, utils_1.parseValue)(value, partTypes), [value, partTypes]);
    (0, react_1.useEffect)(() => {
        if (plainText.length === 0) {
            console.log("Reset cursor to start");
            requestAnimationFrame(() => {
                setSelection({ start: 0, end: 0 });
            });
        }
    }, [plainText]);
    const handleSelectionChange = (event) => {
        setSelection(event.nativeEvent.selection);
        onSelectionChange === null || onSelectionChange === void 0 ? void 0 : onSelectionChange(event);
    };
    const onChangeInput = (changedText) => {
        let processedText = (0, utils_1.generateValueFromPartsAndChangedText)(parts, plainText, changedText);
        // Apply auto-completion for each trigger that has suggestions
        const mentionPartTypes = partTypes.filter((partType) => partType.trigger != null);
        mentionPartTypes.forEach((partType) => {
            const suggestions = autoCompleteSuggestions[partType.trigger];
            if (suggestions && suggestions.length > 0) {
                processedText = (0, utils_1.autoCompleteMentions)(processedText, suggestions, partType.trigger);
            }
        });
        onChange(processedText);
    };
    const keywordByTrigger = (0, react_1.useMemo)(() => {
        return (0, utils_1.getMentionPartSuggestionKeywords)(parts, plainText, selection, partTypes);
    }, [parts, plainText, selection, partTypes]);
    // Find the active trigger based on current keywords
    const activeTrigger = (0, react_1.useMemo)(() => {
        const mentionPartTypes = partTypes.filter((partType) => partType.trigger != null);
        for (const partType of mentionPartTypes) {
            if ((keywordByTrigger === null || keywordByTrigger === void 0 ? void 0 : keywordByTrigger[partType.trigger]) !== undefined) {
                return partType;
            }
        }
        return mentionPartTypes[0] || null;
    }, [keywordByTrigger, partTypes]);
    const onSuggestionPress = (mentionType, isSuggestion = true) => (suggestion) => {
        const currentCursorPosition = selection.start;
        console.log("Current cursor position:", JSON.stringify(selection), `- ${suggestion.title}`);
        console.log("parts:", parts);
        console.log("plainText:", plainText);
        console.log("keywordByTrigger:", keywordByTrigger);
        console.log("mentionType:", mentionType);
        console.log("isSuggestion:", isSuggestion);
        console.log("suggestion:", suggestion);
        const newValue = (0, utils_1.generateValueWithAddedSuggestion)(parts, mentionType, plainText, selection, suggestion, isSuggestion);
        if (!newValue)
            return;
        onChange(newValue);
        console.log("New value:", newValue);
        let nextCursor = 1;
        if (!isSuggestion)
            nextCursor += currentCursorPosition + suggestion.title.length + 1;
        else {
            const triggerKeyword = keywordByTrigger === null || keywordByTrigger === void 0 ? void 0 : keywordByTrigger[mentionType.trigger];
            const triggerKeywordLength = triggerKeyword ? triggerKeyword.length : 0;
            nextCursor +=
                currentCursorPosition +
                    suggestion.title.length -
                    triggerKeywordLength;
        }
        console.log("3- Next cursor position:", nextCursor);
        setTimeout(() => {
            setSelection({ start: nextCursor, end: nextCursor });
        }, 1000);
    };
    const handleTextInputRef = (ref) => {
        textInput.current = ref;
        if (propInputRef) {
            if (typeof propInputRef === "function") {
                propInputRef(ref);
            }
            else {
                propInputRef.current = ref;
            }
        }
    };
    return (react_1.default.createElement(react_1.default.Fragment, null, renderListSelection === null || renderListSelection === void 0 ? void 0 :
        renderListSelection({
            onSuggestionPress: onSuggestionPress(activeTrigger || partTypes[0], false),
        }),
        react_1.default.createElement(react_native_1.View, { style: containerStyle },
            react_1.default.createElement(react_native_1.TextInput, Object.assign({ multiline: true }, textInputProps, { ref: handleTextInputRef, onChangeText: onChangeInput, onSelectionChange: handleSelectionChange, selection: selection }),
                react_1.default.createElement(react_native_1.Text, null, parts.map(({ text, partType, data }, index) => {
                    var _a, _b;
                    return partType ? (react_1.default.createElement(react_native_1.Text, { key: `${index}-${(_a = data === null || data === void 0 ? void 0 : data.trigger) !== null && _a !== void 0 ? _a : "pattern"}`, style: (_b = partType.textStyle) !== null && _b !== void 0 ? _b : utils_1.defaultMentionTextStyle }, text)) : (react_1.default.createElement(react_native_1.Text, { key: index }, text));
                }))),
            activeTrigger &&
                renderListSuggestions({
                    keyword: keywordByTrigger === null || keywordByTrigger === void 0 ? void 0 : keywordByTrigger[activeTrigger.trigger],
                    onSuggestionPress: onSuggestionPress(activeTrigger),
                    trigger: activeTrigger.trigger,
                }))));
};
exports.MentionInput = MentionInput;
//# sourceMappingURL=mention-input.js.map