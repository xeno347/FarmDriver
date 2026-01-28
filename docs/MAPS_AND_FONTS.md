Maps & Fonts Setup
==================

1) Install the native maps package

- Android/iOS package (recommended):

```bash
# from project root
npm install react-native-maps --save
# or yarn add react-native-maps
```

- iOS: after install run:

```bash
cd ios && pod install && cd ..
```

2) Android API key (Google Maps)

- Add your Google Maps API key to `android/app/src/main/AndroidManifest.xml` inside the `<application>` tag:

```xml
<!-- Add inside <application> -->
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="YOUR_ANDROID_GOOGLE_MAPS_API_KEY_HERE" />
```

3) iOS API key (Apple/Google)

- For Google Maps on iOS add your API key in `AppDelegate` per react-native-maps docs or set the key in `AppDelegate.m` using `GMSServices provideAPIKey:@"YOUR_IOS_KEY";` after importing Google Maps.

4) Using the project's MapView wrapper

- The repo includes `src/components/MapViewWrapper.tsx` which will use the native `react-native-maps` if installed; once the package and keys are in place the wrapper will render a live MapView.

5) Fonts

- Drop your `.ttf` / `.otf` font files into `assets/fonts/`.
- `react-native.config.js` already includes `assets: ['./assets/fonts/']`.
- Run the platform linking command:

```bash
# Android/iOS (React Native 0.60+ should auto-link, but run this to copy assets):
npx react-native-asset
# or
npx react-native link
```

6) Rebuild

- After installing native libs and adding keys/fonts, rebuild the app:

```bash
npx react-native run-android
npx react-native run-ios
```

Notes
- If you want I can add the exact AndroidManifest/Info.plist edits, update `MapViewWrapper` to force-enable maps, and wire font-family references across styles once you add the font files or provide the font names.
