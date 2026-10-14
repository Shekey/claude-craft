import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { test } from "node:test";
import { hooks, makeRepo } from "./helpers.mjs";

const layout = (cwd, dir = ".") => spawnSync("node", [join(hooks, "repo.mjs"), "layout", dir], { cwd, encoding: "utf8" }).stdout;

const component = (name, lines) => `export function ${name}() {\n${"  const x = 1;\n".repeat(lines)}  return null;\n}\n`;

test("a crowded folder and a many-component file are flagged", () => {
  const files = { "package.json": "{}" };
  for (let i = 0; i < 22; i++) files[`lib/module${i}.ts`] = `export const value${i} = ${i};\n`;
  files["components/settings-cards.tsx"] = ["Profile", "Notifications", "Privacy", "Theme", "Language", "Storage"].map((n) => component(n, 40)).join("\n");
  const out = layout(makeRepo(files));
  assert.match(out, /^code files: 23 · size tier: small/m);
  assert.match(out, /^22\tlib\tflag$/m);
  assert.match(out, /^\d+\t6\tcomponents\/settings-cards\.tsx\tflag$/m);
});

test("a small UI kit and test files are not flagged", () => {
  const files = { "src/shared/ui/index.tsx": ["Page", "Row", "Label", "Field", "Button"].map((n) => `export const ${n} = () => null;\n`).join("") };
  for (let i = 0; i < 25; i++) files[`src/__tests__/case${i}.test.ts`] = "test('x', () => {});\n";
  const out = layout(makeRepo(files));
  assert.doesNotMatch(out, /flag$/m);
});

test("the size tier grows with the number of code files", () => {
  const files = {};
  for (let i = 0; i < 60; i++) files[`src/feature${i % 6}/file${i}.ts`] = "export {};\n";
  assert.match(layout(makeRepo(files)), /size tier: medium\+/);
});

test("several components per file across the repo is flagged as a pattern", () => {
  const files = {};
  for (const screen of ["home", "profile", "orders", "cart"]) {
    files[`src/features/${screen}/ui.tsx`] = ["Header", "List", "Footer"].map((n) => `export const ${screen}${n} = () => null;\n`.replace(/^export const (\w)/, (_, c) => `export const ${c.toUpperCase()}`)).join("");
  }
  files["src/features/settings/ui.tsx"] = "export const Settings = () => null;\n";
  const out = layout(makeRepo(files));
  assert.match(out, /^several components per file \(3\+\): 4 of 5 component files\tflag/m);
});

test("one shared file is not a repo pattern", () => {
  const files = { "src/shared/ui/index.tsx": "export const Page = () => null;\nexport const Row = () => null;\nexport const Label = () => null;\n" };
  for (const screen of ["Home", "Profile", "Orders"]) files[`src/pages/${screen}.tsx`] = `export const ${screen} = () => null;\n`;
  assert.match(layout(makeRepo(files)), /^several components per file \(3\+\): 0 of 3 component files$/m);
});

const signals = (cwd, ...files) => spawnSync("node", [join(hooks, "repo.mjs"), "signals", ...files], { cwd, encoding: "utf8" }).stdout;
const expo = { "package.json": { dependencies: { expo: "54", "expo-router": "6" } } };
const fatScreen = ["Fit", "GoodFit", "ItemCard", "AltRow", "Falls"].map((n, i) => component(n, 30).replace(i ? "export " : "export function", i ? "" : "export default function")).join("\n");
const thinRoute = (screen) => `import { ${screen} } from "../features/${screen.toLowerCase()}";\n\nexport default function Route() {\n  return <${screen} />;\n}\n`;

test("a route file that holds the whole screen is flagged, thin routes and layouts are not", () => {
  const files = {
    ...expo,
    "app/fit.tsx": fatScreen,
    "app/plan.tsx": thinRoute("PlanScreen"),
    "app/_layout.tsx": ["Root", "Tabs"].map((n) => component(n, 50)).join("\n"),
    "app/+not-found.tsx": component("NotFound", 90),
  };
  const out = layout(makeRepo(files));
  assert.match(out, /^\d+\t5\tapp\/fit\.tsx\tflag · 5 components, \d+ lines$/m);
  assert.doesNotMatch(out, /app\/plan\.tsx\tflag|_layout\.tsx\tflag ·|not-found\.tsx\tflag ·/);
  assert.match(out, /^screens in route files \(2\+\): 1 of 2 route files, 1 thin$/m);
});

test("a route file exporting helpers is flagged; framework exports are allowed", () => {
  const files = {
    ...expo,
    "app/a.tsx": `export function formatPlace(p: string) {\n  return p;\n}\nexport default function A() {\n  return null;\n}\n`,
    "app/b.tsx": `export const unstable_settings = { initialRouteName: "index" };\nexport function ErrorBoundary() {\n  return null;\n}\nexport default function B() {\n  return null;\n}\n`,
  };
  const out = layout(makeRepo(files));
  assert.match(out, /app\/a\.tsx\tflag · exports formatPlace$/m);
  assert.doesNotMatch(out, /app\/b\.tsx\tflag/);
});

test("two routes holding their screen next to thin ones are flagged as a pattern", () => {
  const files = { ...expo, "app/index.tsx": thinRoute("TodayScreen"), "app/plan.tsx": thinRoute("PlanScreen") };
  for (const name of ["fit", "closet"]) files[`app/${name}.tsx`] = fatScreen;
  assert.match(layout(makeRepo(files)), /^screens in route files \(2\+\): 2 of 4 route files, 2 thin\tflag$/m);
});

const smallScreen = `import { useRouter } from "expo-router";
import { useState } from "react";
import { Button, Page, Title } from "../shared/ui";

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  return (
    <Page>
      <Title>Step {step + 1}</Title>
      <Button label="Next" onPress={() => (step ? router.replace("/") : setStep(1))} />
    </Page>
  );
}
`;

test("a short route that builds its own screen is flagged; params and Stack.Screen options are thin", () => {
  const files = {
    ...expo,
    "app/onboarding.tsx": smallScreen,
    "app/item.tsx": `import { Stack, useLocalSearchParams } from "expo-router";
import { ItemScreen } from "../features/closet/ItemScreen";

export default function Item() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <Stack.Screen options={{ title: "Item" }} />
      <ItemScreen id={id} />
    </>
  );
}
`,
  };
  const out = layout(makeRepo(files));
  assert.match(out, /app\/onboarding\.tsx\tflag · calls useRouter, useState$/m);
  assert.doesNotMatch(out, /app\/item\.tsx\tflag/);
});

test("route files only count when the app uses a file router", () => {
  assert.doesNotMatch(layout(makeRepo({ "package.json": {}, "app/fit.tsx": fatScreen })), /route files/);
});

test("signals checks the changed files and names each reason", () => {
  const repo = makeRepo({ ...expo, "app/plan.tsx": thinRoute("PlanScreen"), "app/fit.tsx": fatScreen });
  assert.match(signals(repo), /^app\/fit\.tsx\tflag · many components: 5 in \d+ lines · screen in route file: 5 components, \d+ lines$/m);
  assert.doesNotMatch(signals(repo), /plan\.tsx/);
  assert.match(signals(repo, "app/plan.tsx"), /^no flags in 1 file\(s\)$/m);
});

test("next pages are route files: a thin async page passes, a page building its screen is flagged", () => {
  const files = {
    "package.json": { dependencies: { next: "16", react: "19" } },
    "app/items/[id]/page.tsx": `import { notFound } from "next/navigation";
import { getItem } from "@/features/items/server";
import { ItemScreen } from "@/features/items/ItemScreen";

export const revalidate = 60;

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();
  return <ItemScreen item={item} />;
}
`,
    "app/dashboard/page.tsx": `export default async function Dashboard() {
  const rows = await fetch("https://api.example.com/rows").then((r) => r.json());
  return (
    <main>
      <h1>Dashboard</h1>
      <ul>{rows.map((r: { id: string; name: string }) => <li key={r.id}>{r.name}</li>)}</ul>
    </main>
  );
}
`,
    "app/dashboard/layout.tsx": component("DashboardLayout", 90),
    "app/components/Chart.tsx": component("Chart", 90),
  };
  const out = layout(makeRepo(files));
  assert.match(out, /app\/dashboard\/page\.tsx\tflag · renders 4 elements$/m);
  assert.doesNotMatch(out, /items\/\[id\]\/page\.tsx\tflag|layout\.tsx\tflag ·|Chart\.tsx\tflag ·/);
  assert.match(out, /^screens in route files \(2\+\): 1 of 2 route files, 1 thin$/m);
});

test("tanstack router files: Route export and param hooks are thin, an inline page is flagged", () => {
  const files = {
    "package.json": { dependencies: { "@tanstack/react-router": "1", react: "19" } },
    "src/routes/__root.tsx": component("Root", 90),
    "src/routes/posts.$id.tsx": `import { createFileRoute } from "@tanstack/react-router";
import { fetchPost } from "@/features/posts/api";
import { PostScreen } from "@/features/posts/PostScreen";

export const Route = createFileRoute("/posts/$id")({
  loader: ({ params }) => fetchPost(params.id),
  component: PostRoute,
});

function PostRoute() {
  const post = Route.useLoaderData();
  return <PostScreen post={post} />;
}
`,
    "src/routes/settings.tsx": `import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/settings")({ component: Settings });

function Settings() {
  const [dark, setDark] = useState(false);
  return <button onClick={() => setDark(!dark)}>{dark ? "Dark" : "Light"}</button>;
}
`,
    "src/routes/-components/Big.tsx": component("Big", 90),
  };
  const out = layout(makeRepo(files));
  assert.match(out, /src\/routes\/settings\.tsx\tflag · calls useState$/m);
  assert.doesNotMatch(out, /posts\.\$id\.tsx\tflag|__root\.tsx\tflag ·|Big\.tsx\tflag ·/);
});

test("nuxt pages are route files checked on their script and template", () => {
  const files = {
    "package.json": { dependencies: { nuxt: "4", vue: "3" } },
    "pages/habits/[id].vue": `<script setup lang="ts">
const route = useRoute();
definePageMeta({ layout: "app" });
</script>

<template>
  <HabitScreen :id="String(route.params.id)" />
</template>
`,
    "pages/stats.vue": `<script setup lang="ts">
const { data } = await useFetch("/api/stats");
const best = computed(() => data.value?.items.filter((i) => i.done).length ?? 0);
</script>

<template>
  <section>
    <h1>Stats</h1>
    <p>{{ best }} done</p>
  </section>
</template>
`,
  };
  const out = layout(makeRepo(files));
  assert.match(out, /pages\/stats\.vue\tflag · calls useFetch$/m);
  assert.doesNotMatch(out, /habits\/\[id\]\.vue\tflag/);
});

test("nest controllers with direct ORM access are flagged, controllers calling services are not", () => {
  const repo = makeRepo({
    "package.json": { dependencies: { "@nestjs/core": "11", "@nestjs/typeorm": "11" } },
    "src/orders/orders.controller.ts": `import { Controller, Get } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Order } from "./order.entity";

@Controller("orders")
export class OrdersController {
  constructor(@InjectRepository(Order) private readonly orders: Repository<Order>) {}

  @Get()
  list() {
    return this.orders.find();
  }
}
`,
    "src/users/users.controller.ts": `import { Controller, Get } from "@nestjs/common";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list() {
    return this.users.list();
  }
}
`,
  });
  const out = layout(repo);
  assert.match(out, /^controllers and resolvers \(2; flag on direct ORM or database access\)$/m);
  assert.match(out, /src\/orders\/orders\.controller\.ts\tflag · data access in controller: TypeORM$/m);
  assert.doesNotMatch(out, /users\.controller\.ts\tflag/);
  assert.match(signals(repo, "src/orders/orders.controller.ts"), /flag · data access in controller: TypeORM/);
});
