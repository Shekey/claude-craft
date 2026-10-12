import { MaterialCommunityIcons } from "@expo/vector-icons";
import { formatUnits, type Pick, type Recommendation, type VerdictKind } from "@sww/engine";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { oddsLine } from "../features/comfort/insight";
import { useKeep } from "../features/today/keep";
import { fitLine, itemSubtitle, SKY_ICON, warmthOf4 } from "../features/wardrobe/describe";
import { useGoBack } from "../shared/nav";
import { color, font, type } from "../shared/theme/theme";
import { formatClock, formatDayShort, sameDay } from "../shared/time";
import {
  Button,
  Caps,
  Card,
  Chip,
  Divider,
  Heading,
  type IconName,
  Page,
  Panel,
  Row,
  SectionHeader,
  Small,
  Title,
  TopBar,
} from "../shared/ui";
import { ItemThumb } from "../shared/ui/Thumb";
import { formatTemp, type Units } from "../shared/units";
import { useApp } from "../state/app-state";

export default function Fit() {
  const app = useApp();
  const goBack = useGoBack();
  const { rec, units, plan } = app;
  if (!rec) {
    return (
      <Page>
        <TopBar back />
        <Heading
          title="Nothing to show yet."
          subtitle="Go back to Today and let the plan load first."
        />
        <Button label="Back to Today" onPress={() => goBack()} />
      </Page>
    );
  }
  // "Falls short" is only for an owned item that isn't enough. With an empty closet the generic answer is the plan.
  const ownsShortItem = rec.verdict.items.some((i) => i.shortfall);
  return rec.outfitFits || !ownsShortItem ? (
    <GoodFit rec={rec} units={units} home={plan.home} />
  ) : (
    <Falls rec={rec} units={units} home={plan.home} />
  );
}

const VERDICT_ICON: Record<VerdictKind, IconName> = {
  jacket: "hanger",
  shoes: "shoe-sneaker",
  layer: "tshirt-crew-outline",
  umbrella: "umbrella-outline",
  hood: "weather-windy",
  gloves: "hand-back-left-outline",
  hat: "hat-fedora",
  sunglasses: "sunglasses",
};

/* ---------- "A good fit for today." ---------- */

function GoodFit({
  rec,
  units,
  home,
}: {
  rec: Recommendation & { id: string };
  units: Units;
  home: Date;
}) {
  const goBack = useGoBack();
  const { keep, busy } = useKeep(rec, home, { via: "screen", onDone: goBack });
  const s = rec.summary;
  const jacket = rec.jacket.pick?.meetsNeed ? rec.jacket.pick : null;
  const shoes = rec.shoes.pick?.meetsNeed ? rec.shoes.pick : null;
  const wind = rec.advice.find((a) => a.kind === "wind");
  // Today's hero shows one note; the others are here.
  const tip = rec.advice.find((a) => a.kind === "carry" || a.kind === "layer");
  const { insight } = useApp();
  const odds = insight ? oddsLine(insight.odds) : null;
  // Everything not shown as an owned item card: generic garments and accessories.
  const generic = rec.verdict.items.filter((i) => !i.ownedId && i.kind !== "layer");

  return (
    <Page bottomPad={40}>
      <TopBar back />
      <Heading
        title="Why this outfit."
        subtitle="Matched to how you feel the cold, for the whole time you're outside."
      />

      <Panel>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Caps>
            {formatClock(s.plannedFrom)} → Home {formatClock(s.plannedTo)}
          </Caps>
          <Caps>Low for you {formatTemp(s.designPerceivedC, units)}</Caps>
        </View>
        <Text style={[type.title, { fontSize: 17, lineHeight: 24 }]}>
          Warm enough for {formatClock(s.coldestAt)}.
          {s.firstWetAt ? ` Dry through the ${s.snow ? "snow" : "rain"} window.` : ""}
        </Text>
      </Panel>

      {jacket && !jacket.optional && <ItemCard pick={jacket} units={units} />}
      {shoes && <ItemCard pick={shoes} units={units} />}

      {generic.length > 0 && (
        <Card style={{ gap: 18, paddingVertical: 20 }}>
          {generic.map((i) => (
            <Row
              key={i.kind}
              icon={VERDICT_ICON[i.kind]}
              title={i.label}
              detail={i.note ? formatUnits(i.note, units) : genericDetail(i.kind, rec, units)}
            />
          ))}
        </Card>
      )}

      <Panel>
        <Row icon="tshirt-crew-outline" title={rec.baseLayer.title} detail={rec.baseLayer.detail} />
        {tip && (
          <Row
            icon={tip.kind === "carry" ? "bag-personal-outline" : "tshirt-crew-outline"}
            title={formatUnits(tip.title, units)}
          />
        )}
        {wind && (
          <Row
            icon="weather-windy"
            title={`Zip up before ${formatClock(s.coldestAt)}`}
            detail={`Gusts of ${formatUnits(`{s:${Math.round(s.maxGustKmh)}}`, units)} add chill.${s.firstWetAt ? " Use your hood in rain." : ""}`}
          />
        )}
      </Panel>

      {odds && (
        <Card>
          <Row
            icon="emoticon-happy-outline"
            title={odds.headline}
            detail={odds.risk ?? undefined}
          />
        </Card>
      )}

      {rec.jacket.pick && rec.jacket.alternatives.length > 0 && (
        <>
          <SectionHeader title="Other owned options" />
          <Card style={{ gap: 16 }}>
            {rec.jacket.alternatives.slice(0, 3).map((p, i) => (
              <View key={p.item.id}>
                {i > 0 && (
                  <View style={{ marginBottom: 16 }}>
                    <Divider />
                  </View>
                )}
                <AltRow pick={p} units={units} />
              </View>
            ))}
          </Card>
        </>
      )}

      {(jacket || shoes) && (
        <Small>
          Fit scores compare warmth and wet-weather protection to your plan. Higher is better; a
          high score is not a weather guarantee.
        </Small>
      )}
      <Small>
        Keep it and I'll ask how it felt when you're home. Every answer makes your next one more
        accurate.
      </Small>
      <Button label="Keep this outfit" onPress={keep} busy={busy} />
    </Page>
  );
}

/** Why a generic garment is on the list, for items the user hasn't added yet. */
function genericDetail(kind: VerdictKind, rec: Recommendation, units: Units): string | undefined {
  if (kind === "jacket")
    return formatUnits(
      rec.jacket.needInfo.detail.replace(/^You own warmth \d at most\. /, ""),
      units,
    );
  if (kind === "shoes")
    return rec.shoes.need.snow
      ? "Insulated, grippy and sealed for snow."
      : rec.shoes.need.water === 2
        ? "Rain is heavy enough to soak through fabric shoes."
        : "Closed shoes keep the chill out.";
  return undefined;
}

function ItemCard({ pick, units }: { pick: Pick; units: Units }) {
  const it = pick.item;
  return (
    <Card style={{ gap: 14 }}>
      <View style={{ flexDirection: "row", gap: 16 }}>
        <ItemThumb item={it} size={84} radiusPx={16} />
        <View style={{ flex: 1, gap: 3, justifyContent: "center" }}>
          <Title style={{ fontSize: 17 }}>{it.name}</Title>
          <Small>{itemSubtitle(it)}</Small>
          <Text style={{ fontFamily: font.semibold, fontSize: 13.5, color: color.accent }}>
            {fitLine(pick.score, pick.label)}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <Chip label={warmthOf4(it.warmth)} />
        {it.water !== "none" && (
          <Chip label={it.water === "waterproof" ? "Waterproof" : "Water-resistant"} />
        )}
        {it.snow === "ready" && <Chip label="Snow-ready" />}
      </View>
      {pick.reason ? (
        <Small style={{ color: color.body2 }}>{formatUnits(pick.reason, units)}</Small>
      ) : null}
    </Card>
  );
}

function AltRow({ pick, units }: { pick: Pick; units: Units }) {
  return (
    <View style={{ flexDirection: "row", gap: 14 }}>
      <ItemThumb item={pick.item} size={64} radiusPx={14} />
      <View style={{ flex: 1, gap: 2 }}>
        <Title style={{ fontSize: 16 }}>{pick.item.name}</Title>
        <Small>{formatUnits(pick.reason ?? "", units)}</Small>
        <Text
          style={{ fontFamily: font.semibold, fontSize: 13, color: color.accent, marginTop: 2 }}
        >
          {fitLine(pick.score, pick.label)}
        </Text>
      </View>
    </View>
  );
}

/* ---------- "Your kit falls short." ---------- */

function Falls({
  rec,
  units,
  home,
}: {
  rec: Recommendation & { id: string };
  units: Units;
  home: Date;
}) {
  const app = useApp();
  const router = useRouter();
  const goBack = useGoBack();
  const { keep, busy } = useKeep(rec, home, { via: "screen", onDone: goBack });
  const s = rec.summary;
  const from = new Date(s.plannedFrom);
  const tomorrow = !sameDay(from, new Date());
  const lowHour = rec.hours.find((h) => h.time === s.coldestAt);
  const missing = rec.jacket.pick?.meetsNeed === false ? "jacket" : "shoe";
  const place = app.place
    ? (app.place.query.split(",")[0] ?? app.place.label.split(",")[0])
    : "your location";

  return (
    <Page bottomPad={40}>
      <TopBar back />
      <Heading
        title="Your kit falls short."
        subtitle={`${tomorrow ? "Tomorrow's" : "Today's"} ${from.getHours() >= 16 ? "evening " : ""}plan · ${place}`}
      />

      <Panel>
        <View
          style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
        >
          <Caps>
            {tomorrow ? formatDayShort(from) : "Today"} · {formatClock(s.plannedFrom)}–
            {formatClock(s.plannedTo)}
          </Caps>
          <MaterialCommunityIcons
            name={SKY_ICON[lowHour?.sky ?? "cloudy"]}
            size={22}
            color={color.accent}
          />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <Text maxFontSizeMultiplier={1.3} style={type.big}>
            {formatTemp(s.designPerceivedC, units)}
          </Text>
          <View style={{ flex: 1, gap: 4 }}>
            <Title style={{ fontSize: 17 }}>For you, at {formatClock(s.coldestAt)}</Title>
            <Small>{formatUnits(s.conditions, units)}</Small>
          </View>
        </View>
      </Panel>

      <Panel tone="warn">
        <Row
          icon="alert-outline"
          tone="warn"
          title="No complete owned outfit fits"
          detail="Your warmest jacket and shoes are below this plan's needs. The options below are not fully suitable alternatives."
        />
      </Panel>

      <SectionHeader title="What this plan needs" />
      <Card style={{ gap: 18 }}>
        <Row
          icon="tshirt-crew-outline"
          title={rec.jacket.needInfo.title}
          detail={formatUnits(rec.jacket.needInfo.detail, units)}
        />
        <Row
          icon="shoe-sneaker"
          title={rec.shoes.needInfo.title}
          detail={formatUnits(rec.shoes.needInfo.detail, units)}
        />
      </Card>

      <SectionHeader title="Closest items you own" action="Still insufficient" />
      <Card style={{ gap: 16 }}>
        {[rec.jacket.pick, rec.shoes.pick]
          .filter((p): p is Pick => !!p)
          .map((p, i) => (
            <View key={p.item.id}>
              {i > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Divider />
                </View>
              )}
              <AltRow pick={p} units={units} />
            </View>
          ))}
        {!rec.jacket.pick && !rec.shoes.pick && (
          <Small>You haven't added any jackets or shoes yet.</Small>
        )}
      </Card>

      <Small>
        {rec.baseLayer.sleeves === "long"
          ? "Wear long sleeves as a base. For the colder hours, a short-sleeve tee alone won't give enough coverage."
          : "A short-sleeve tee is fine as a base here; the jacket does the work."}
      </Small>

      <Panel>
        <Title style={{ fontSize: 16 }}>Already own something warmer?</Title>
        <Small>
          Add it to your closet and check the plan again, or change when you'll be home.
        </Small>
      </Panel>

      <Button
        label="Add an owned item"
        onPress={() => router.push({ pathname: "/add-item", params: { category: missing } })}
      />
      <Button label="Change return-home time" kind="soft" onPress={() => router.push("/plan")} />
      <Button label="Keep this plan anyway" kind="text" onPress={keep} busy={busy} />
    </Page>
  );
}
