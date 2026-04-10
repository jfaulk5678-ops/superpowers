---
name: frontend-design
description: Use when building user interfaces, components, or frontend features
---

# Frontend Design

## Overview

Build user interfaces that are accessible, responsive, and maintainable. Apply component design principles, proper state management, styling best practices, and accessibility standards.

## When to Use

**Use when:**
- Building new UI components
- Creating forms, tables, cards, or interactive elements
- Implementing responsive layouts
- Adding user interface features

**Not when:**
- Backend-only work
- Pure data processing without UI
- Infrastructure configuration

## Component Design

### Single Responsibility

Each component should do one thing well. Extract sub-components when:
- Component has two distinct visual modes (view/edit)
- A section is reusable elsewhere
- Props are becoming excessive (>7)

```jsx
// BAD: Monolithic component
function UserProfileCard({ user, onEdit, onDelete }) {
  // 200 lines of view + edit mode + form validation
}

// GOOD: Separated concerns
function UserProfileCard({ user, onEdit, onDelete }) {
  return (
    <Card>
      <UserAvatar user={user} />
      <UserInfo user={user} />
      <CardActions>
        <EditButton onClick={onEdit} />
        <DeleteButton onClick={onDelete} />
      </CardActions>
    </Card>
  );
}
```

### Props Interface

Define clear prop interfaces with defaults:

```jsx
function Button({ 
  variant = 'primary',  // primary, secondary, danger
  size = 'medium',      // small, medium, large
  disabled = false,
  children,
  onClick 
}) {
  return (
    <button 
      className={`btn btn-${variant} btn-${size}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### Component Composition Patterns

| Pattern | Use When |
|---------|----------|
| Container/Presentational | Data fetching separate from display |
| Compound Components | Props API is complex (Select, Tabs) |
| Render Props | Logic reuse across components |
| Higher-Order Components | Cross-cutting concerns |
| Custom Hooks | Stateful logic reuse |

Custom hooks for reusable stateful logic:

```jsx
function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, showToast, removeToast };
}
```

## State Management

### Choosing State Approach

```
Is state shared across components?
├─ NO → useState (local state)
└─ YES → Is it complex/derived?
         ├─ NO → prop drilling or Context
         └─ YES → Consider Redux/Zustand/ Jotai
```

### Local State (useState)

For component-local state:

```jsx
function LoginForm({ onSubmit }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  // ...
}
```

### Derived State (useMemo)

Always memoize computed values:

```jsx
function ProductTable({ products }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filter, setFilter] = useState('');

  // Memoize expensive computations
  const sortedAndFilteredData = useMemo(() => {
    let data = [...products];
    
    if (filter) {
      data = data.filter(p => 
        p.name.toLowerCase().includes(filter.toLowerCase())
      );
    }
    
    if (sortConfig.key) {
      data.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        // ...
      });
    }
    
    return data;
  }, [products, sortConfig, filter]);

  const paginatedData = useMemo(() => {
    return sortedAndFilteredData.slice(0, 10);
  }, [sortedAndFilteredData]);

  return <Table data={paginatedData} />;
}
```

### Context for Shared State

Use Context for truly global state:

```jsx
// Theme context
const ThemeContext = createContext();

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Usage
function ThemedButton() {
  const { theme } = useContext(ThemeContext);
  return <button className={`btn btn-${theme}`}>Click</button>;
}
```

### Form State Patterns

For forms, consider controlled components with validation:

```jsx
function FormWithValidation() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = (values) => {
    const errors = {};
    if (!values.email.includes('@')) {
      errors.email = 'Invalid email';
    }
    return errors;
  };

  const handleChange = (field) => (e) => {
    setValues({ ...values, [field]: e.target.value });
    if (touched[field]) {
      setErrors(validate(values));
    }
  };

  const handleBlur = (field) => () => {
    setTouched({ ...touched, [field]: true });
    setErrors(validate(values));
  };

  return (
    <form>
      <input
        value={values.email}
        onChange={handleChange('email')}
        onBlur={handleBlur('email')}
        aria-invalid={!!errors.email}
        aria-describedby={errors.email ? 'email-error' : undefined}
      />
      {errors.email && (
        <span id="email-error" role="alert">
          {errors.email}
        </span>
      )}
    </form>
  );
}
```

## Styling Approaches

### Choosing a Styling Approach

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| Plain CSS | Simple, universal | Global namespace | Small projects |
| CSS Modules | Scoped, composable | No dynamic classes | Medium projects |
| CSS-in-JS | Scoped, dynamic | Runtime overhead | Component libraries |
| Tailwind | Fast development | Learning curve | Large projects |

### CSS Best Practices

Always include:
- Responsive breakpoints
- Focus visible states
- Transitions for interactions
- Mobile-first approach

```css
/* Mobile-first */
.button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  transition: background-color 0.2s, transform 0.1s;
}

.button:hover {
  background-color: #0056b3;
}

.button:active {
  transform: scale(0.98);
}

.button:focus-visible {
  outline: 2px solid #0056b3;
  outline-offset: 2px;
}

/* Tablet and up */
@media (min-width: 768px) {
  .button {
    padding: 1rem 2rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .button {
    padding: 1rem 2.5rem;
  }
}
```

### BEM Naming Convention

```css
/* Block */
.card { }

/* Element */
.card__header { }
.card__body { }
.card__footer { }

/* Modifier */
.card--featured { }
.card--compact { }
```

## Accessibility

### Essential Accessibility Checklist

Every interactive component must have:
- [ ] Proper semantic HTML (button for actions, a for navigation)
- [ ] Keyboard accessible (Tab, Enter, Space, Escape)
- [ ] Focus visible (never remove outline without replacement)
- [ ] ARIA attributes where needed
- [ ] Color contrast meets WCAG AA (4.5:1 for text)

### ARIA Quick Reference

| Attribute | Use When |
|----------|----------|
| `aria-label` | Interactive element without visible text |
| `aria-describedby` | Additional context (error messages) |
| `aria-invalid` | Form field with validation error |
| `aria-required` | Required form field |
| `aria-disabled` | Disabled but focusable element |
| `aria-expanded` | Collapsible element |
| `aria-pressed` | Toggle button state |
| `aria-selected` | Option in select/listbox |
| `role="alert"` | Error messages (live region) |
| `role="dialog"` | Modal dialog |

### Focus Management

```jsx
// Trap focus in modal
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
      // Focus trap logic
    }
  }, [isOpen]);

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      ref={modalRef}
      tabIndex={-1}
    >
      <h2 id="modal-title">Title</h2>
      {children}
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

### Form Accessibility

```jsx
<form>
  <label htmlFor="email">Email address</label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid={!!errors.email}
    aria-describedby="email-hint email-error"
  />
  <span id="email-hint">We'll never share your email.</span>
  {errors.email && (
    <span id="email-error" role="alert" aria-live="polite">
      {errors.email}
    </span>
  )}
</form>
```

### Screen Reader Considerations

- Announce dynamic content changes with `aria-live`
- Use `sr-only` class for visually hidden but screen-reader accessible text
- Ensure all images have meaningful alt text (or `alt=""` for decorative)
- Tables need proper headers (`th`, `scope`)

```css
/* Visually hidden but accessible */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

## Responsive Design

### Mobile-First Approach

Write base styles for mobile, enhance for larger screens:

```css
/* Base (mobile) */
.container {
  padding: 1rem;
  font-size: 14px;
}

/* Enhancement (tablet) */
@media (min-width: 768px) {
  .container {
    padding: 1.5rem;
    font-size: 16px;
  }
}

/* Enhancement (desktop) */
@media (min-width: 1024px) {
  .container {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

### Common Breakpoints

| Breakpoint | Width | Device |
|-----------|-------|--------|
| sm | 640px | Large phone |
| md | 768px | Tablet |
| lg | 1024px | Desktop |
| xl | 1280px | Large desktop |

### Responsive Patterns

**Stack on mobile, side-by-side on desktop:**
```css
.container {
  display: flex;
  flex-direction: column;
}

@media (min-width: 768px) {
  .container {
    flex-direction: row;
  }
}
```

**Collapse navigation:**
```css
.nav-links {
  display: none;
}

@media (min-width: 768px) {
  .nav-links {
    display: flex;
  }
}

@media (max-width: 767px) {
  .nav-menu.open + .nav-links {
    display: flex;
    flex-direction: column;
  }
}
```

### Responsive Images

```css
img {
  max-width: 100%;
  height: auto;
}

picture {
  width: 100%;
}
```

```html
<picture>
  <source media="(min-width: 1024px)" srcset="image-lg.jpg" />
  <source media="(min-width: 768px)" srcset="image-md.jpg" />
  <img src="image-sm.jpg" alt="Description" />
</picture>
```

### Touch-Friendly Targets

- Minimum touch target: 44x44px
- Adequate spacing between targets: 8px minimum
- Avoid precise interactions on mobile

```css
.button {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 16px;
}
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Not memoizing derived state | Use useMemo for sorted/filtered data |
| Removing focus outline | Always provide focus-visible alternative |
| Skipping ARIA on custom controls | Add appropriate ARIA attributes |
| Writing desktop styles first | Mobile-first with min-width media queries |
| Monolithic components | Extract when >150 lines or multiple responsibilities |
| Inline styles for everything | Use proper CSS classes |
| Hardcoded values | Use CSS custom properties |
| No error boundaries | Add error handling for components |
| Not testing with keyboard | Tab through all interactive elements |

## Quick Reference

### Component Decision Tree

```
Need to share state?
├─ NO → useState
└─ YES → How complex?
         ├─ Simple → Context
         └─ Complex → External store (Redux/Zustand)

Need derived data?
└─ YES → useMemo

Need side effects?
└─ YES → useEffect (or useCallback for handlers)
```

### Responsive Checklist

- [ ] Mobile layout works without horizontal scroll
- [ ] Touch targets ≥44px
- [ ] Text readable without zooming (16px base)
- [ ] Images responsive (max-width: 100%)
- [ ] Forms usable on mobile
- [ ] Navigation works on all screen sizes
- [ ] No content hidden on small screens

### Accessibility Checklist

- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Error messages announced to screen readers
- [ ] Focus order logical
- [ ] Keyboard can access all functionality
- [ ] Color contrast ≥4.5:1
- [ ] Focus indicators visible
- [ ] No keyboard traps
