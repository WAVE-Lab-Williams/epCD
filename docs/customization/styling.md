# Customizing Styling

The experiment styling is controlled by `src/css/styles.css`. Most researchers can use the default JSPsych styling as-is.

## Basic Changes

### Colors
To change the main colors, edit these lines in `src/css/styles.css`:

```css
body {
    background-color: #f0f0f0;  /* Page background - change to your preference */
}

.jspsych-btn {
    background-color: #4CAF50;  /* Button color - change to your preference */
}
```

### Font Size
To make text larger or smaller:

```css
.jspsych-content {
    font-size: 18px;  /* Default is 16px, increase for larger text */
}
```

## Testing Changes

After editing the CSS file:
1. Save the file
2. Refresh your browser (Ctrl+R or Cmd+R)
3. Check that the changes look good throughout the experiment

## When to Customize

Most psychology experiments work fine with the default JSPsych styling. Only customize if:
- Your lab has specific branding requirements
- You need larger text for accessibility
- Your stimuli require specific background colors

For most experiments, focus on the content and parameters rather than styling.