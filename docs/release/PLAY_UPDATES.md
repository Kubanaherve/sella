# Updating Sella on Google Play

The first upload and every later update must be the same app.

- Package name: `com.sella.app`. Do not change `applicationId` in `android/app/build.gradle`.
- Upload key: `~/Keys/sella-upload.keystore`, alias `sella`. The password is in `~/Keys/sella-upload.txt` on this Mac. A second copy of both files is in your personal files. Neither file is in GitHub.
- Play Console must use this key for the first upload. Turn on Play App Signing when you upload.

## Ship a change

1. Edit the project at `/Users/friendkh/Projects/Mom_app_Bijoux/sella`.
2. In `android/app/build.gradle`, add 1 to `versionCode`. Change `versionName` when you want the store to show a new number, for example `1.1`.
3. Build the signed bundle:

```bash
cd /Users/friendkh/Projects/Mom_app_Bijoux/sella
npm run cap:sync
cd android
./gradlew bundleRelease
```

4. Upload `android/app/build/outputs/bundle/release/app-release.aab` to the existing Sella listing in Play Console. Do not create a second app.

If `~/Keys/sella-upload.keystore` is missing, stop. A new key cannot update the app that is already on Play.
