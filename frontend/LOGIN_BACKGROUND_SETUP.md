# Login Background Image Setup

## Required Action

The login page expects a background image at:

```
/home/administrator/Desktop/asset-management/frontend/public/login-bg.jpg
```

## Steps to Add the Background Image:

1. Save the provided sunset/landscape image as `login-bg.jpg`

2. Place it in the public folder:
   ```bash
   cp /path/to/your/sunset-image.jpg /home/administrator/Desktop/asset-management/frontend/public/login-bg.jpg
   ```

3. The image will automatically be used as the login background

4. Rebuild the frontend:
   ```bash
   cd /home/administrator/Desktop/asset-management/frontend
   npm run build
   ```

## Image Requirements:

- **Format:** JPG, PNG, or WebP
- **Recommended size:** 1920x1080 or higher
- **Aspect ratio:** 16:9 (landscape)
- **File size:** Optimized for web (< 500KB recommended)

## Current Setup:

The LoginPage.css currently references `/login-bg.jpg` which will serve the image from the public folder.

If the image is not found, the browser will show the subtle overlay color only.

## Alternative Location:

You can also place the image in `src/assets/` and import it in LoginPage.js:

```javascript
import loginBackground from '../assets/login-bg.jpg';
```

Then update LoginPage.css to use:
```css
background-image: 
  linear-gradient(rgba(10, 18, 28, 0.15), rgba(10, 18, 28, 0.15)),
  var(--login-bg-url);
```

And set the CSS variable in the component.
