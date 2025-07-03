import * as React from "react";
import { FC, useState } from "react";
import { Pressable, SafeAreaView, Text, View } from "react-native";
import { MentionInput, MentionSuggestionsProps, Suggestion } from "../src";

const users: Suggestion[] = [
  { id: 1, title: "David Tabaka" },
  { id: 2, title: "Mary" },
  { id: 3, title: "Tony" },
  { id: 4, title: "Mike" },
  { id: 5, title: "Grey" },
];

const hashtags = [
  { id: 1, title: "todo" },
  { id: 2, title: "help" },
  { id: 3, title: "loveyou" },
];

const renderSuggestions: (
  suggestions: Suggestion[]
) => FC<MentionSuggestionsProps> =
  (suggestions) =>
  ({ keyword, onSuggestionPress }) => {
    // Only hide suggestions if keyword is undefined (not actively typing a mention)
    // Show suggestions if keyword is an empty string (just typed the trigger)
    if (keyword === undefined) {
      return null;
    }

    return (
      <View>
        {suggestions
          .filter((one) =>
            one.title.toLocaleLowerCase().includes(keyword.toLocaleLowerCase())
          )
          .map((one) => (
            <Pressable
              key={one.id}
              onPress={() => onSuggestionPress(one)}
              style={{ padding: 12 }}
            >
              <Text>{one.title}</Text>
            </Pressable>
          ))}
      </View>
    );
  };

const renderMentionSuggestions = renderSuggestions(users);

const renderHashtagSuggestions = renderSuggestions(hashtags);

// Combined suggestions handler that shows different suggestions based on the active trigger
const renderCombinedSuggestions: FC<MentionSuggestionsProps> = ({
  keyword,
  onSuggestionPress,
  trigger,
}) => {
  // Only hide suggestions if keyword is undefined (not actively typing a mention)
  // Show suggestions if keyword is an empty string (just typed the trigger)
  if (keyword === undefined) {
    return null;
  }

  // Show different suggestions based on the active trigger
  if (trigger === "@") {
    const filteredUsers = users.filter((one) =>
      one.title.toLocaleLowerCase().includes(keyword.toLocaleLowerCase())
    );

    return (
      <View>
        <Text style={{ fontWeight: "bold", padding: 8, color: "blue" }}>
          Users:
        </Text>
        {filteredUsers.map((one) => (
          <Pressable
            key={`user-${one.id}`}
            onPress={() => onSuggestionPress(one)}
            style={{ padding: 12, backgroundColor: "#e3f2fd", marginBottom: 2 }}
          >
            <Text>@{one.title}</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  if (trigger === "#") {
    const filteredHashtags = hashtags.filter((one) =>
      one.title.toLocaleLowerCase().includes(keyword.toLocaleLowerCase())
    );

    return (
      <View>
        <Text style={{ fontWeight: "bold", padding: 8, color: "orange" }}>
          Hashtags:
        </Text>
        {filteredHashtags.map((one) => (
          <Pressable
            key={`hashtag-${one.id}`}
            onPress={() => onSuggestionPress(one)}
            style={{ padding: 12, backgroundColor: "#fff3e0", marginBottom: 2 }}
          >
            <Text>#{one.title}</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  return null;
};

const App = () => {
  const [value, setValue] = useState(
    "Hello @[Mary](2)! Check out #[todo](1) items."
  );

  return (
    <SafeAreaView>
      <MentionInput
        value={value}
        onChange={setValue}
        partTypes={[
          {
            trigger: "@",
            textStyle: { fontWeight: "bold", color: "blue" },
          },
          {
            trigger: "#",
            textStyle: { fontWeight: "bold", color: "orange" },
          },
          {
            pattern:
              /(https?:\/\/|www\.)[-a-zA-Z0-9@:%._\+~#=]{1,256}\.(xn--)?[a-z0-9-]{2,20}\b([-a-zA-Z0-9@:%_\+\[\],.~#?&\/=]*[-a-zA-Z0-9@:%_\+\]~#?&\/=])*/gi,
            textStyle: { color: "blue" },
          },
        ]}
        renderListSuggestions={renderCombinedSuggestions}
        placeholder="Type @ for users or # for hashtags..."
        style={{ padding: 12, minHeight: 100 }}
      />
    </SafeAreaView>
  );
};

export default App;
