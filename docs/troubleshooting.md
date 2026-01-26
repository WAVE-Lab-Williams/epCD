# Troubleshooting

Common issues and solutions when using the experiment template.

## Setup Issues

### "nvm: command not found"
**Problem**: nvm is not installed
**Solution**: Follow the installation instructions at https://github.com/nvm-sh/nvm

### "Cannot find module" errors
**Problem**: Dependencies not installed
**Solution**: 
```bash
npm install
```

### Browser shows file listing instead of experiment
**Problem**: Not using the development server
**Solution**: 
```bash
npm run dev
```
Then visit `http://localhost:8080/`

## WAVE Integration Issues

### "WAVE parameters missing" in console
**Problem**: URL missing required parameters
**Solution**: Add parameters to URL:
```
http://localhost:8080/?key=your_api_key&experiment_id=uuid&participant_id=P001
```

### "Failed to log data to WAVE" errors
**Possible causes**:
- Experiment schema not defined in WAVE backend
- Incorrect experiment_id
- API key invalid
- Backend not running

**Solution**: Verify experiment exists in WAVE backend with correct schema

### Data only shows locally
**Problem**: WAVE backend connection failed
**Solution**: This is normal for testing. For production, ensure backend is accessible and parameters are correct.

## Experiment Issues

### Images not loading
**Problem**: Incorrect image paths
**Solution**: 
- Check images exist in `src/assets/stimuli/circles/`
- Verify filenames match exactly in `src/js/core/timeline.js`
- Check browser console for 404 errors

### Wrong response keys
**Problem**: Response mapping doesn't match instructions
**Solution**: Update both:
- Response prompt in `src/js/core/trial.js`
- Correct response logic in the same file

### Experiment sections not showing
**Problem**: Boolean flags turned off
**Solution**: Check `src/js/core/params.js`:
```javascript
var runIntro = true;  // Set to true to show this section
var runInstr = true;
var runExpt = true;
var runClose = true;
```

## Browser Console Errors

### Check the Console
Press F12 in your browser and look at the Console tab for error messages. Common errors:

- **"404 Not Found"**: File path is wrong
- **"Uncaught ReferenceError"**: Variable name typo
- **"CORS error"**: Not using development server (use `npm run dev`)

## Getting Help

1. **Check browser console** for specific error messages
2. **Verify file paths** are correct after any changes
3. **Test with minimal changes** - make one change at a time
4. **Use the original files** as reference if you get stuck

## File Recovery

If you accidentally break something, the key files to check are:
- `index.html` - Main experiment file
- `src/js/core/params.js` - Basic settings
- `src/js/core/timeline.js` - Experiment flow

Make sure these files exist and have the correct script/CSS references.