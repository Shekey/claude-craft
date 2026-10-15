---
name: ui
description: The UI path of craft:task. Use when the task builds or changes a screen, component, layout, styling or UX flow, or links a Figma design. Finds the design source, reads it through the Figma MCP when connected, builds with the repo's own components and tokens (shadcn/ui when the repo uses it), covers every state, and checks the result against the design.
argument-hint: "[what to build] [figma URL]"
---

# Build UI

The task: `$ARGUMENTS` (or the user's last message). This path runs after `craft:plan` has an approved plan, and follows the stack pack for code structure.

## 1. UI setup (every time, asks only once)
Read the `## UI` section of the conventions file. If it is missing, or a line below is unknown, fill it in now and run `node "${CLAUDE_PLUGIN_ROOT}/hooks/repo.mjs" mark`:

```
## UI
Components: shadcn/ui (components.json, registries: @shadcn) | <library> | own kit at src/shared/ui
Tokens: <where colors, spacing and type live: tailwind theme, CSS variables, theme.ts>
Figma: <file URL> · <what it covers>   (or: none)
Preview: <storybook command, dev server URL, or none>
```

- Components: `components.json` means shadcn/ui or shadcn-vue (its `aliases` say where components live); spartan/ui is its Angular counterpart; otherwise the UI library in package.json, or the folder the existing screens import their primitives from.
- Figma: ask once with AskUserQuestion: "Is there a Figma file for this app? Paste its URL, or choose No design." Record the answer, `none` included, so later tasks don't ask again. A Figma URL in the task always wins over the recorded one.

## 2. Read the design
With a Figma URL for this task:
- If Figma MCP tools are available (names such as `get_design_context`, `get_screenshot`, `get_variable_defs`, `get_code_connect_map`), use them on the node in the URL. If a `figma:figma-design-to-code` skill (or `figma-implement-design`) is listed, load it first and follow it for the tool calls; craft's rules below still decide where code goes and which components it uses.
- Get the design context, a screenshot to compare against later, and the variables the node uses. Large frames: fetch child nodes one by one rather than the whole page.
- If no Figma tools are available, say so in one line, name how to connect them (`claude plugin install figma@claude-plugins-official`, or `claude mcp add --transport http figma https://mcp.figma.com/mcp`, then authenticate in `/mcp`), and continue from a screenshot or description the user gives. Never guess a design from the URL alone.

Without a design: build from the description using the repo's existing screens as the reference (mirror the closest one), and list the UX choices you made in the plan so the user can correct them.

## 3. Map the design to the repo
- Components: use the repo's own components first, then Code Connect mappings if the Figma file has them, then the library. With shadcn/ui, use the installed components; add a missing one with the shadcn CLI (`<pm> dlx shadcn@latest add <name>`) or the shadcn MCP server when it is connected, and adapt it in place. Never bring shadcn or another UI library into a repo that uses a different one, unless the task asks.
- Tokens: map every Figma variable to the repo's existing token (Tailwind theme key, CSS variable, theme constant). No raw hex, pixel or font values when a token exists; when none does, add one in the token file and say so.
- Structure: the stack pack's shape. The screen in its feature folder, one file per component with its own props, view functions for what the screen shows (D11), the route file thin (D6).
- Copy: use the text from the design; mark missing strings as questions, never invent product copy silently.

## 4. Cover every state
The design usually shows one state; the code needs all of them. For each screen and component: loading, empty, error (with a way to retry), populated, long content (wrapping, truncation, many items), and pending or disabled actions. Responsive: the breakpoints the design or repo uses. Dark mode when the repo has it.

Accessibility is part of done: semantic elements or roles, labels on inputs and icon buttons, visible focus, keyboard reachability for web, focus moved into and back from dialogs, contrast from the tokens, touch targets at least 44pt on mobile and 24px on web.

## 5. Check against the design
- Run what the repo has: Storybook, the dev server, or a simulator, and look at the result next to the Figma screenshot. List the differences that remain and why (a token the design breaks, a state the design lacks).
- Tests: view functions as unit tests; components by role and text in the repo's runner. No snapshot tests unless the repo already uses them.

## 6. Tail
Apply the shared tail from `craft:task`. End with: the Figma node or reference used, the states covered, and any design questions left open.
