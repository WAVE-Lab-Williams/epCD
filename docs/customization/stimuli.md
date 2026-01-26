# Customizing Stimuli

This guide explains how to add and modify stimuli for your experiment.

## Changing Your Images

### 1. Add Your Images
1. **Add your images** to the `src/assets/stimuli/circles/` folder
2. **Supported formats**: PNG, JPG, GIF
3. **Recommended size**: 300x300 pixels (will be scaled to 150px display width)

### 2. Update Parameters
In `src/js/core/params.js`, update the folder path if needed:
```javascript
var stimFolder = 'src/assets/stimuli/circles/'
```

### 3. Update Stimulus Names
In `src/js/core/timeline.js` around line 168:
```javascript
var poss_circle_colors = ["your-stim1", "your-stim2"];
```

Replace with your actual stimulus names (without file extension).

### 4. Update Response Mapping
In `src/js/core/trial.js`, update the correct response logic:
```javascript
correct_response: function(){
    if (stimColor === 'your-stim1') {
        return 'f';
    } else if (stimColor === 'your-stim2') {
        return 'j';
    }
},
```

## Stimulus Organization

### Folder Structure
```
src/assets/stimuli/
├── circles/              # Current experiment stimuli
│   ├── blue-circle.png
│   ├── orange-circle.png
│   └── demo-circles.png
└── your-experiment/      # Your custom stimuli
    ├── stimulus1.png
    ├── stimulus2.png
    └── demo.png
```

### Multiple Stimulus Sets
For experiments with different stimulus sets:

1. **Create separate folders**:
   ```
   src/assets/stimuli/
   ├── faces/
   ├── objects/
   └── words/
   ```

2. **Update folder parameter**:
   ```javascript
   var stimFolder = 'src/assets/stimuli/faces/'
   ```

## Display Properties

### Image Sizing
In `src/js/core/params.js`:
```javascript
// Original image dimensions
var origWidth = 300;
var origHeight = 300;

// Display dimensions (will be scaled proportionally)
var imgWidth = 150; // your desired display width
var imgHeight = (imgWidth / origWidth) * origHeight;
```

### Stimulus Duration
Control how long stimuli are displayed in `src/js/core/timeline.js`:
```javascript
var poss_disp_duration = [200, 500]; // milliseconds
```

## Demo/Instruction Images

Update the demo image used in instructions in `src/js/core/timeline.js`:
```javascript
forPreload.push(`${stimFolder}demo-circles.png`);
```

Replace `demo-circles.png` with your instruction demo image.

## Testing Your Changes

After updating stimuli:
1. **Save all files**
2. **Refresh** your browser (http://localhost:8080/)
3. **Check browser console** (F12) for loading errors
4. **Run through the experiment** to test stimulus display

## Troubleshooting

**Images not loading:**
- Check file paths are correct
- Verify image files exist in the specified folder
- Check browser console for 404 errors

**Wrong stimulus displayed:**
- Verify stimulus names match exactly (case-sensitive)
- Check the `poss_circle_colors` array matches your file names

**Size issues:**
- Adjust `imgWidth` parameter
- Ensure original dimensions are set correctly