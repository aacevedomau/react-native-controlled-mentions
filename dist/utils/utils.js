"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoCompleteMentions = exports.replaceMentionValues = exports.getValueFromParts = exports.parseValue = exports.getMentionValue = exports.generateMentionPart = exports.generatePlainTextPart = exports.generateValueWithAddedSuggestion = exports.generateValueFromPartsAndChangedText = exports.getMentionPartSuggestionKeywords = exports.isMentionPartType = exports.defaultMentionTextStyle = exports.mentionRegEx = void 0;
const diff_1 = require("diff");
// @ts-ignore the lib do not have TS declarations yet
const string_prototype_matchall_1 = __importDefault(require("string.prototype.matchall"));
/**
 * RegEx grouped results. Example - "@[@Full Name](123abc)" or "#[#hashtag](456def)"
 * We have 5 groups here:
 * - The whole original string - "@[@Full Name](123abc)" or "#[#hashtag](456def)"
 * - Mention trigger - "@" or "#"
 * - Inner trigger - "@" or "#" (should match the outer trigger)
 * - Name - "Full Name" or "hashtag" (without trigger)
 * - Id - "123abc" or "456def"
 */
// Updated regex to match patterns like: @[@Full Name](123) or #[#hashtag](456)
// The \2 is a backreference to ensure the inner trigger matches the outer trigger
const mentionRegEx = /((.)\[(\2)([^[]*)]\(([^(^)]*)\))/gi;
exports.mentionRegEx = mentionRegEx;
const defaultMentionTextStyle = {
    fontWeight: "bold",
    color: "blue",
};
exports.defaultMentionTextStyle = defaultMentionTextStyle;
const defaultPlainStringGenerator = ({ trigger }, { title }) => `${trigger}${title}`;
const isMentionPartType = (partType) => {
    return partType.trigger != null;
};
exports.isMentionPartType = isMentionPartType;
const getPartIndexByCursor = (parts, cursor, isIncludeEnd) => {
    return parts.findIndex((one) => cursor >= one.position.start && isIncludeEnd
        ? cursor <= one.position.end
        : cursor < one.position.end);
};
/**
 * The method for getting parts between two cursor positions.
 * ```
 * | part1 |   part2   |   part3   |
 *  a b c|d e f g h i j h k|l m n o
 *  ```
 *  We will get 3 parts here:
 *  1. Part included 'd'
 *  2. Part included 'efghij'
 *  3. Part included 'hk'
 *  Cursor will move to position after 'k'
 *
 * @param parts full part list
 * @param cursor current cursor position
 * @param count count of characters that didn't change
 */
const getPartsInterval = (parts, cursor, count) => {
    const newCursor = cursor + count;
    const currentPartIndex = getPartIndexByCursor(parts, cursor);
    const currentPart = parts[currentPartIndex];
    const newPartIndex = getPartIndexByCursor(parts, newCursor, true);
    const newPart = parts[newPartIndex];
    let partsInterval = [];
    if (!currentPart || !newPart) {
        return partsInterval;
    }
    // Push whole first affected part or sub-part of the first affected part
    if (currentPart.position.start === cursor &&
        currentPart.position.end <= newCursor) {
        partsInterval.push(currentPart);
    }
    else {
        partsInterval.push(generatePlainTextPart(currentPart.text.substr(cursor - currentPart.position.start, count)));
    }
    if (newPartIndex > currentPartIndex) {
        // Concat fully included parts
        partsInterval = partsInterval.concat(parts.slice(currentPartIndex + 1, newPartIndex));
        // Push whole last affected part or sub-part of the last affected part
        if (newPart.position.end === newCursor &&
            newPart.position.start >= cursor) {
            partsInterval.push(newPart);
        }
        else {
            partsInterval.push(generatePlainTextPart(newPart.text.substr(0, newCursor - newPart.position.start)));
        }
    }
    return partsInterval;
};
/**
 * Function for getting object with keyword for each mention part type
 *
 * If keyword is undefined then we don't tracking mention typing and shouldn't show suggestions.
 * If keyword is not undefined (even empty string '') then we are tracking mention typing.
 *
 * Examples where @title is just plain text yet, not mention:
 * '|abc @title dfg' - keyword is undefined
 * 'abc @| dfg' - keyword is ''
 * 'abc @title| dfg' - keyword is 'title'
 * 'abc @na|me dfg' - keyword is 'na'
 * 'abc @|title dfg' - keyword is against ''
 * 'abc @title |dfg' - keyword is 'title '
 * 'abc @title dfg|' - keyword is 'title dfg'
 * 'abc @title dfg |' - keyword is undefined (we have more than one space)
 * 'abc @title dfg he|' - keyword is undefined (we have more than one space)
 */
const getMentionPartSuggestionKeywords = (parts, plainText, selection, partTypes) => {
    const keywordByTrigger = {};
    partTypes
        .filter(isMentionPartType)
        .forEach(({ trigger, allowedSpacesCount = 1 }) => {
        keywordByTrigger[trigger] = undefined;
        // Check if we don't have selection range
        if (selection.end != selection.start) {
            return;
        }
        // Find the part with the cursor
        const part = parts.find((one) => selection.end > one.position.start &&
            selection.end <= one.position.end);
        // Check if the cursor is not in mention type part
        if (part == null || part.data != null) {
            return;
        }
        const triggerIndex = plainText.lastIndexOf(trigger, selection.end);
        // Return undefined in case when:
        if (
        // - the trigger index is not event found
        triggerIndex == -1 ||
            // - the trigger index is out of found part with selection cursor
            triggerIndex < part.position.start ||
            // - the trigger is not at the beginning and we don't have space or new line before trigger
            (triggerIndex > 0 && !/[\s\n]/gi.test(plainText[triggerIndex - 1]))) {
            return;
        }
        // Looking for break lines and spaces between the current cursor and trigger
        let spacesCount = 0;
        for (let cursor = selection.end - 1; cursor >= triggerIndex; cursor -= 1) {
            // Mention cannot have new line
            if (plainText[cursor] === "\n") {
                return;
            }
            // Incrementing space counter if the next symbol is space
            if (plainText[cursor] === " ") {
                spacesCount += 1;
                // Check maximum allowed spaces in trigger word
                if (spacesCount > allowedSpacesCount) {
                    return;
                }
            }
        }
        keywordByTrigger[trigger] = plainText.substring(triggerIndex + 1, selection.end);
    });
    return keywordByTrigger;
};
exports.getMentionPartSuggestionKeywords = getMentionPartSuggestionKeywords;
/**
 * Generates new value when we changing text.
 *
 * @param parts full parts list
 * @param originalText original plain text
 * @param changedText changed plain text
 */
const generateValueFromPartsAndChangedText = (parts, originalText, changedText) => {
    const changes = (0, diff_1.diffChars)(originalText, changedText);
    let newParts = [];
    let cursor = 0;
    changes.forEach((change) => {
        switch (true) {
            /**
             * We should:
             * - Move cursor forward on the changed text length
             */
            case change.removed: {
                cursor += change.count;
                break;
            }
            /**
             * We should:
             * - Push new part to the parts with that new text
             */
            case change.added: {
                newParts.push(generatePlainTextPart(change.value));
                break;
            }
            /**
             * We should concat parts that didn't change.
             * - In case when we have only one affected part we should push only that one sub-part
             * - In case we have two affected parts we should push first
             */
            default: {
                if (change.count !== 0) {
                    newParts = newParts.concat(getPartsInterval(parts, cursor, change.count));
                    cursor += change.count;
                }
                break;
            }
        }
    });
    return getValueFromParts(newParts);
};
exports.generateValueFromPartsAndChangedText = generateValueFromPartsAndChangedText;
/**
 * Method for adding suggestion to the parts and generating value. We should:
 * - Find part with plain text where we were tracking mention typing using selection state
 * - Split the part to next parts:
 * -* Before new mention
 * -* With new mention
 * -* After mention with space at the beginning
 * - Generate new parts array and convert it to value
 *
 * @param parts - full part list
 * @param mentionType - actually the mention type
 * @param plainText - current plain text
 * @param selection - current selection
 * @param suggestion - suggestion that should be added
 */
const generateValueWithAddedSuggestion = (parts, mentionType, plainText, selection, suggestion, isSuggestion) => {
    console.log("🚀 generateValueWithAddedSuggestion", `\n\nparts: ${JSON.stringify(parts)}`);
    const currentPartIndex = parts.findIndex((one) => selection.end >= one.position.start && selection.end <= one.position.end);
    const currentPart = parts[currentPartIndex];
    console.log("🚀 currentPartIndex:", currentPartIndex, `\ncurrentPart: ${JSON.stringify(currentPart)}`);
    if (!currentPart) {
        return;
    }
    const triggerPartIndex = currentPart.text.lastIndexOf(mentionType.trigger, selection.end - currentPart.position.start);
    const newMentionPartPosition = {
        start: isSuggestion
            ? triggerPartIndex
            : selection.start - currentPart.position.start,
        end: selection.end - currentPart.position.start,
    };
    const isInsertSpaceToNextPart = mentionType.isInsertSpaceAfterMention;
    return getValueFromParts([
        ...parts.slice(0, currentPartIndex),
        // Create part with string before mention
        generatePlainTextPart(currentPart.text.substring(0, newMentionPartPosition.start)),
        generateMentionPart(mentionType, Object.assign({ original: getMentionValue(mentionType.trigger, suggestion), trigger: mentionType.trigger }, suggestion)),
        // Create part with rest of string after mention and add a space if needed
        generatePlainTextPart(`${isInsertSpaceToNextPart ? " " : ""}${currentPart.text.substring(newMentionPartPosition.end)}`),
        ...parts.slice(currentPartIndex + 1),
    ]);
};
exports.generateValueWithAddedSuggestion = generateValueWithAddedSuggestion;
/**
 * Method for generating part for plain text
 *
 * @param text - plain text that will be added to the part
 * @param positionOffset - position offset from the very beginning of text
 */
const generatePlainTextPart = (text, positionOffset = 0) => ({
    text,
    position: {
        start: positionOffset,
        end: positionOffset + text.length,
    },
});
exports.generatePlainTextPart = generatePlainTextPart;
/**
 * Method for generating part for mention
 *
 * @param mentionPartType: MentionPartType
 * @param mention: MentionData
 * @param positionOffset: number
 */
const generateMentionPart = (mentionPartType, mention, positionOffset = 0) => {
    const text = mentionPartType.getPlainString
        ? mentionPartType.getPlainString(mention)
        : defaultPlainStringGenerator(mentionPartType, mention);
    return {
        text,
        position: {
            start: positionOffset,
            end: positionOffset + text.length,
        },
        partType: mentionPartType,
        data: mention,
    };
};
exports.generateMentionPart = generateMentionPart;
/**
 * Generates part for matched regex result
 *
 * @param partType - current part type (pattern or mention)
 * @param result - matched regex result
 * @param positionOffset - position offset from the very beginning of text
 */
const generateRegexResultPart = (partType, result, positionOffset = 0) => ({
    text: result[0],
    position: {
        start: positionOffset,
        end: positionOffset + result[0].length,
    },
    partType,
});
/**
 * Method for generation mention value that accepts mention regex
 *
 * @param trigger
 * @param suggestion
 */
const getMentionValue = (trigger, suggestion) => `${trigger}[${trigger}${suggestion.title}](${suggestion.id})`;
exports.getMentionValue = getMentionValue;
const getMentionDataFromRegExMatchResult = ([, original, trigger, innerTrigger, // This should match the outer trigger
title, id,]) => ({
    original,
    trigger,
    title,
    id: Number(id),
});
/**
 * Recursive function for deep parse MentionInput's value and get plainText with parts
 *
 * @param value - the MentionInput's value
 * @param partTypes - All provided part types
 * @param positionOffset - offset from the very beginning of plain text
 */
const parseValue = (value, partTypes, positionOffset = 0) => {
    if (value == null) {
        value = "";
    }
    let plainText = "";
    let parts = [];
    // We don't have any part types so adding just plain text part
    if (partTypes.length === 0) {
        plainText += value;
        parts.push(generatePlainTextPart(value, positionOffset));
    }
    else {
        const [partType, ...restPartTypes] = partTypes;
        const regex = isMentionPartType(partType) ? mentionRegEx : partType.pattern;
        const matches = Array.from((0, string_prototype_matchall_1.default)(value !== null && value !== void 0 ? value : "", regex));
        // In case when we didn't get any matches continue parsing value with rest part types
        if (matches.length === 0) {
            return parseValue(value, restPartTypes, positionOffset);
        }
        // In case when we have some text before matched part parsing the text with rest part types
        if (matches[0].index != 0) {
            const text = value.substr(0, matches[0].index);
            const plainTextAndParts = parseValue(text, restPartTypes, positionOffset);
            parts = parts.concat(plainTextAndParts.parts);
            plainText += plainTextAndParts.plainText;
        }
        // Iterating over all found pattern matches
        for (let i = 0; i < matches.length; i++) {
            const result = matches[i];
            if (isMentionPartType(partType)) {
                const mentionData = getMentionDataFromRegExMatchResult(result);
                // Matched pattern is a mention and the mention doesn't match current mention type
                // We should parse the mention with rest part types
                if (mentionData.trigger !== partType.trigger) {
                    const plainTextAndParts = parseValue(mentionData.original, restPartTypes, positionOffset + plainText.length);
                    parts = parts.concat(plainTextAndParts.parts);
                    plainText += plainTextAndParts.plainText;
                }
                else {
                    const part = generateMentionPart(partType, mentionData, positionOffset + plainText.length);
                    parts.push(part);
                    plainText += part.text;
                }
            }
            else {
                const part = generateRegexResultPart(partType, result, positionOffset + plainText.length);
                parts.push(part);
                plainText += part.text;
            }
            // Check if the result is not at the end of whole value so we have a text after matched part
            // We should parse the text with rest part types
            if (result.index + result[0].length !== value.length) {
                // Check if it is the last result
                const isLastResult = i === matches.length - 1;
                // So we should to add the last substring of value after matched mention
                const text = value.slice(result.index + result[0].length, isLastResult ? undefined : matches[i + 1].index);
                const plainTextAndParts = parseValue(text, restPartTypes, positionOffset + plainText.length);
                parts = parts.concat(plainTextAndParts.parts);
                plainText += plainTextAndParts.plainText;
            }
        }
    }
    // Exiting from parseValue
    return {
        plainText,
        parts,
    };
};
exports.parseValue = parseValue;
/**
 * Function for generation value from parts array
 *
 * @param parts
 */
const getValueFromParts = (parts) => parts.map((item) => (item.data ? item.data.original : item.text)).join("");
exports.getValueFromParts = getValueFromParts;
/**
 * Replace all mention values in value to some specified format
 *
 * @param value - value that is generated by MentionInput component
 * @param replacer - function that takes mention object as parameter and returns string
 */
const replaceMentionValues = (value, replacer) => value.replace(mentionRegEx, (fullMatch, original, trigger, innerTrigger, title, id) => replacer({
    original,
    trigger,
    title,
    id: Number(id),
}));
exports.replaceMentionValues = replaceMentionValues;
/**
 * Auto-completes mentions that match exactly with available suggestions
 *
 * @param text The input text to process
 * @param suggestions Available suggestions for the trigger
 * @param trigger The trigger character (e.g., '@', '#')
 * @returns Text with auto-completed mentions
 */
const autoCompleteMentions = (text, suggestions, trigger) => {
    if (!suggestions || suggestions.length === 0) {
        return text;
    }
    // Escape the trigger for regex
    const escapedTrigger = trigger.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Regex that matches: trigger + word + (space or end of text)
    // And that is NOT already formatted as a mention
    const pattern = new RegExp(`${escapedTrigger}([a-zA-Z0-9_]+)(?=\\s|$)(?![\\]\\)])`, "g");
    return text.replace(pattern, (match, word, offset) => {
        // Verify it's not part of an already formatted mention
        const beforeMatch = text.substring(0, text.indexOf(offset));
        if (beforeMatch.endsWith("[") ||
            match.includes("[") ||
            match.includes("]")) {
            return match;
        }
        // Look for exact match (case-insensitive)
        const matchingSuggestion = suggestions.find((suggestion) => suggestion.title.toLowerCase() === word.toLowerCase());
        if (matchingSuggestion) {
            return `${trigger}[${trigger}${matchingSuggestion.title}](${matchingSuggestion.id})`;
        }
        return match;
    });
};
exports.autoCompleteMentions = autoCompleteMentions;
//# sourceMappingURL=utils.js.map