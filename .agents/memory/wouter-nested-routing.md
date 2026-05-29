---
name: wouter nested layout routing
description: Why a layout-wrapping route must be path-less, not a wildcard, in wouter v3
---

# wouter nested layout routing

When wrapping a group of routes in a shared layout (e.g. an authenticated `AppShell`), use a **path-less catch-all** `<Route>` as the wrapper:

```jsx
<Switch>
  <Route path="/" component={Landing} />
  <Route path="/signin" component={SignIn} />
  <Route>                         {/* catch-all, no path */}
    <AppShell>
      <Switch>
        <Route path="/apply" component={ApplyDashboard} />
        <Route path="/apply/new" component={ApplyNew} />
        <Route path="/apply/:id" component={ApplyDetail} />
      </Switch>
    </AppShell>
  </Route>
</Switch>
```

**Why:** A wrapper whose `path` ends in `*` (e.g. `path="/:rest*"` or `path="/*"`) triggers wouter's nested-routing base-stripping. The inner `<Switch>` then matches against a *stripped* path, so single-segment routes like `/apply` still render but any multi-segment child (`/apply/new`, `/apply/123`) silently renders **blank with no console error** — extremely hard to debug. A path-less `<Route>` matches as a fallback without consuming/altering the base, so inner routes match the full path.

**How to apply:** Any time you see a blank page on a nested route while sibling shorter routes work, check for a `*`-terminated wrapper route and replace it with a path-less `<Route>`.
