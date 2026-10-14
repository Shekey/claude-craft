import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useOnboarding } from "../features/account/use-onboarding";
import { DEFAULT_COLD_C, LEVELS } from "../features/comfort/comfort-levels";
import { LocationPicker } from "../features/settings";
import { color, type } from "../shared/theme/theme";
import { Button, Display, ErrorPanel, Page, Small, Tap, TextLink } from "../shared/ui";
import { Icon } from "../shared/ui/Icon";

/** Two questions, then the answer: how cold you get, and where you are. Everything else has a sensible default. */
export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1>(0);
  const [base, setBase] = useState<number | null>(null);
  const { finish, busy, err } = useOnboarding();

  const done = async () => {
    if (await finish(base ?? DEFAULT_COLD_C)) router.replace("/");
  };

  return (
    <Page bottomPad={40}>
      <View className="flex-row gap-[6px] mt-[8px]">
        {[0, 1].map((i) => (
          <View
            key={i}
            className="flex-1 h-[4px] rounded-[2px]"
            style={{ backgroundColor: i <= step ? color.accent : color.track }}
          />
        ))}
      </View>

      {step === 0 && (
        <Animated.View entering={FadeIn.duration(260)} className="gap-[14px]">
          <View className="gap-[8px]">
            <Text style={[type.body, { fontSize: 15, color: color.sub }]}>
              A forecast for your body, not the sky.
            </Text>
            <Display>How cold do you get?</Display>
            <Small>
              Everyone feels 12° differently. I'll learn the rest from how your outfits feel.
            </Small>
          </View>
          {LEVELS.map((l) => {
            const on = base === l.value;
            return (
              <Tap
                key={l.value}
                selected={on}
                label={l.label}
                onPress={() => setBase(l.value)}
                className="flex-row items-center gap-[14px] p-[18px] rounded-lg border-[1.5px]"
                style={{
                  backgroundColor: on ? color.panel : color.card,
                  borderColor: on ? color.accent : "transparent",
                }}
              >
                <Icon name={l.icon} size={26} color={on ? color.accent : color.sub} />
                <View className="flex-1">
                  <Text style={[type.title, { fontSize: 17 }]}>{l.label}</Text>
                  <Small>{l.sub}</Small>
                </View>
                {on ? <Icon name="check-circle" size={24} color={color.accent} /> : null}
              </Tap>
            );
          })}
          <Button
            label="Continue"
            icon="arrow-right"
            onPress={() => setStep(1)}
            disabled={base === null}
          />
          <Button
            label="Not sure, use average"
            kind="text"
            onPress={() => {
              setBase(DEFAULT_COLD_C);
              setStep(1);
            }}
          />
        </Animated.View>
      )}

      {step === 1 && (
        <Animated.View entering={FadeIn.duration(260)} className="gap-[14px]">
          <Display>Where are you?</Display>
          <Small>I only use it for the forecast, and only as a rough area.</Small>
          <LocationPicker />
          {err && <ErrorPanel title={err.title} body={err.body} reference={err.ref} />}
          <Button label="Show me what to wear" icon="check" onPress={done} busy={busy} />
          <TextLink
            label="Back"
            size={15}
            onPress={() => setStep(0)}
            style={{ alignSelf: "center", paddingHorizontal: 12 }}
          />
        </Animated.View>
      )}
    </Page>
  );
}
