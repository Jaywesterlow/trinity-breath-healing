# HTML Semantics Research

Sources: WHATWG HTML Living Standard, MDN Web Docs, W3C WCAG 2.2 Technique H48.

---

## `<address>`

- Represents contact information for nearest `<article>` or `<body>` ancestor.
- Placing `<address>` inside `<footer>` is explicitly recommended by MDN and the HTML spec.
- Must not contain headings, sectioning content, or nested `<header>`/`<footer>`/`<address>` elements.
- Content model: flow content — `<ul>/<li>` inside `<address>` is valid.

## `<ul>` / `<li>` for contact items

- WCAG 2.2 Technique H48 (Sufficient for 1.3.1 Info and Relationships): groups of related items must use `<ul>`, `<ol>`, or `<dl>` so relationships are programmatically determinable.
- Screen readers announce item count when list markup is present ("list, 3 items").
- Contact items (physical address, email, phone) qualify as an unordered list — order is meaningless, so `<ul>` over `<ol>`.

## `<ul>` vs `<div>` for layout groups

- `<ul>` can be styled identically to `<div>` via CSS (`list-style: none; padding: 0; margin: 0`).
- Prefer `<ul>` over `<div>` when content is a collection of equivalent items — the semantic meaning is conveyed to assistive technology at no visual cost.
- `<div>` remains correct for layout wrappers with no inherent list meaning.

## `<address>` + `<ul>` together

Complementary, not competing. Correct pattern:

```html
<address>
  <ul>
    <li>Street address</li>
    <li><a href="mailto:...">email</a></li>
    <li><a href="tel:...">phone</a></li>
  </ul>
</address>
```

## Gaps in the `accessibility-checklist` skill

| Missing | Impact |
|---|---|
| `<address>` not mentioned | Teams use plain `<div>` for contact info |
| `<time>` not mentioned | Dates not machine-readable |
| `<figure>` / `<figcaption>` not mentioned | Captioned images lack programmatic association |
| `<dl>` / `<dt>` / `<dd>` not mentioned | Key-value contact patterns get skipped |
| "Not styled divs" rule lacks scope clarification | Implies all `<div>`s are wrong; layout wrappers are valid |
