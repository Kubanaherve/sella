# Submission readiness

22 November 2026. Workspace: `/Users/friendkh/Projects/Mom_app_Bijoux/SELLA_MASTER_WORKSPACE`  
Live app, unchanged: `/Users/friendkh/Projects/Mom_app_Bijoux/sella`

The app was not rebuilt in this pass. Imports were not edited. To confirm the repo still builds, run the commands in section A from the git repo.

Languages on every store listing in this workspace: English, Kinyarwanda, French, Swahili, Kirundi, Luganda.

## A. Confirm the app

```bash
cd /Users/friendkh/Projects/Mom_app_Bijoux/sella
npm run typecheck
npm test
npm run build
```

`npm run verify` runs typecheck, lint, tests, and the production build together.

## B. Where the real files are

| Need | Path | State |
|---|---|---|
| Official seal, TIN 157374984 | `01_BRAND_AND_DESIGN_SYSTEM/Logos/sella-company-seal-TIN-157374984.png` | Ready |
| Official seal, one copy only | `01_BRAND_AND_DESIGN_SYSTEM/Logos/sella-company-seal-TIN-157374984.png` | Ready |
| Signatory signature | `01_BRAND_AND_DESIGN_SYSTEM/Logos/signatory-friend-herve-kubana.png` | Ready |
| App icon 512×512 | `01_BRAND_AND_DESIGN_SYSTEM/Logos/sella-icon-512.png` | Ready for Play’s 512 icon. Not an Apple 1024 icon. |
| Wordmark and brand pack | `01_BRAND_AND_DESIGN_SYSTEM/Logos/` | Ready |
| Brand rules | `01_BRAND_AND_DESIGN_SYSTEM/Brand_Guidelines/SELLA_BRAND.md` | Ready |
| RDB certificate | `02_LEGAL_AND_COMPLIANCE_RW/RDB_Documents/certificate-KUBANA-Friend-TECHNOLOGIES-LTD (1).pdf` | Copy of the certificate used for the TIN and address |
| Earlier certificate file | `02_LEGAL_AND_COMPLIANCE_RW/RDB_Documents/certificate-KUBANA-Friend-TECHNOLOGIES-LTD.pdf` | Keep. Do not treat it as a second company. |
| Amendment resolutions | `02_LEGAL_AND_COMPLIANCE_RW/RDB_Documents/KUBANA_FRIEND_Technologies_Amendment_Resolution.pdf` and the `-v2` file | Copies |
| Filled corporate KYC | `02_LEGAL_AND_COMPLIANCE_RW/MTN_MoMo_Integration/KYC FORM - KUBANA Friend TECHNOLOGIES LTD.pdf` | Ready to print |
| KYC request letter | `02_LEGAL_AND_COMPLIANCE_RW/MTN_MoMo_Integration/KYC request - KUBANA Friend TECHNOLOGIES LTD.pdf` | Ready to print |
| Filled MoMo Pay form | `02_LEGAL_AND_COMPLIANCE_RW/MTN_MoMo_Integration/MoMoPay Registration - KUBANA Friend TECHNOLOGIES LTD.pdf` | Ready to print |
| MoMo Pay request letter | `02_LEGAL_AND_COMPLIANCE_RW/MTN_MoMo_Integration/MoMoPay request - KUBANA Friend TECHNOLOGIES LTD.pdf` | Ready to print |
| Blank forms | `02_LEGAL_AND_COMPLIANCE_RW/MTN_MoMo_Integration/_blanks/` | Sources only. Do not submit the blanks. |
| Privacy, Terms, deletion | Routes `/privacy`, `/terms`, `/delete-account` in the app | Pages exist. No public URL yet. |
| Play listing draft | `04_APP_STORE_PUBLISHING/Google_Play_Store/Store_Listing/listing.md` | Draft |
| Apple listing draft | `04_APP_STORE_PUBLISHING/Apple_App_Store/Store_Listing/listing.md` | Draft |
| Microsoft listing draft | `04_APP_STORE_PUBLISHING/Microsoft_Store/Store_Listing/listing.md` | Draft |
| Signed `.aab` | `04_APP_STORE_PUBLISHING/Google_Play_Store/Builds/` | Empty |
| iOS archive / IPA | `04_APP_STORE_PUBLISHING/Apple_App_Store/Builds/` | Empty |
| `.msix` | `04_APP_STORE_PUBLISHING/Microsoft_Store/Builds/` | Empty |
| Wrong seals | Removed from the git repo `public/brand` | Do not restore TIN 109876543 or SELLA RWANDA LTD |

## C. What is still missing

| Asset | Required | What you have | Next step |
|---|---|---|---|
| Play App Bundle | Signed `.aab` | Release build type exists. No `signingConfig`. | Section D |
| Play icon | 512×512 PNG | `01_BRAND_AND_DESIGN_SYSTEM/Logos/sella-icon-512.png` | Use this file |
| Play feature graphic | 1024×500 PNG or JPEG | Missing | Section E |
| Play phone screenshots | 1080×1920, at least 2, up to 8 | None in the repo `screenshots/` folder | Section E |
| Apple icon | 1024×1024 PNG, no transparency, no rounded corners baked in | 512×512 only | Section E |
| Apple screenshots | 6.7" 1290×2796, and 6.5" 1284×2778 | Missing | Section E |
| iOS archive | Xcode archive, then TestFlight | Not built | Section F |
| Microsoft package | Signed `.msix` or PWA | Electron shell only | Section G |
| Microsoft hero | 1920×1080 | Missing | Section E |
| Privacy URL | `https` page that stays up | `/privacy` works only inside the running app | Section H |
| Reviewer demo | Shop name, phone, 4-digit PIN | Not created | Section H |

## D. Signed Android App Bundle

Do this on the git repo. Do not commit the keystore.

1. Create a release keystore outside the repo, once:

```bash
keytool -genkeypair -v \
  -keystore "$HOME/Keys/sella-upload.keystore" \
  -alias sella \
  -keyalg RSA -keysize 2048 -validity 10000
```

2. `android/app/build.gradle` has no `signingConfig`. Add a release signing block that reads the store path and passwords from environment variables or from a `keystore.properties` file that is gitignored. Do not paste passwords into this report.

3. Build the bundle:

```bash
cd /Users/friendkh/Projects/Mom_app_Bijoux/sella
npm run cap:sync
cd android
./gradlew bundleRelease
```

4. Copy `android/app/build/outputs/bundle/release/app-release.aab` to `04_APP_STORE_PUBLISHING/Google_Play_Store/Builds/`.

5. In Play Console, turn on Play App Signing, upload the `.aab` to an internal testing track, and confirm the store listing does not contain a buy button. Subscription purchase stays on the website.

`npm run android:apk` builds a **debug** APK. That file is not the Play upload.

## E. Graphics

Feature graphic, 1024×500, from the 512 icon and the wordmark. Example with ImageMagick if it is installed:

```bash
magick -size 1024x500 \
  gradient:'#0B3FCC-#1A6FFF' \
  \( "/Users/friendkh/Projects/Mom_app_Bijoux/SELLA_MASTER_WORKSPACE/01_BRAND_AND_DESIGN_SYSTEM/Logos/sella-icon-512.png" -resize 360x360 \) \
  -gravity center -geometry +0-20 -composite \
  "/Users/friendkh/Projects/Mom_app_Bijoux/SELLA_MASTER_WORKSPACE/04_APP_STORE_PUBLISHING/Google_Play_Store/Graphics/feature-1024x500.png"
```

Apple icon, 1024×1024, opaque:

```bash
magick "/Users/friendkh/Projects/Mom_app_Bijoux/SELLA_MASTER_WORKSPACE/01_BRAND_AND_DESIGN_SYSTEM/Logos/sella-icon-512.png" \
  -resize 1024x1024 -background '#0B3FCC' -alpha remove -alpha off \
  "/Users/friendkh/Projects/Mom_app_Bijoux/SELLA_MASTER_WORKSPACE/04_APP_STORE_PUBLISHING/Apple_App_Store/Graphics/icon-1024.png"
```

Check the result. A plain scale of the 512 icon will look soft. Replace it with a redrawn 1024 master before submission if the edges break.

Screenshots, from a running app:

```bash
cd /Users/friendkh/Projects/Mom_app_Bijoux/sella
npm run dev
```

Capture, at 1080×1920, the screens named in `docs/store/PLAY_ASSETS.md`: PIN unlock, home, debts, add debt, sales report, inventory, subscribe. Subscribe must not look like an in-app purchase on the store binary. Save the files under `04_APP_STORE_PUBLISHING/Google_Play_Store/Graphics/phone/`.

For Apple, use the Simulator at iPhone 6.7-inch and 6.5-inch and export PNGs into `04_APP_STORE_PUBLISHING/Apple_App_Store/Graphics/`.

For Microsoft, capture the Electron window:

```bash
cd /Users/friendkh/Projects/Mom_app_Bijoux/sella
npm run dev
npm run desktop:dev
```

Save at least one 1366×768 PNG and a 1920×1080 hero into `04_APP_STORE_PUBLISHING/Microsoft_Store/Graphics/`.

## F. iOS archive

1. Enroll in the Apple Developer Program.
2. In Xcode, open `ios/App/App.xcworkspace` from the git repo. Set the team and the bundle id `com.sella.app`.
3. Product → Archive. Upload to App Store Connect from the Organizer.
4. Write the build number into `04_APP_STORE_PUBLISHING/Apple_App_Store/Builds/TESTFLIGHT.md` after the upload. Do not commit the archive.
5. Add a reviewer demo account in App Store Connect review notes. See section H.

StoreKit is not implemented. Do not create an in-app subscription until the server can verify it. `docs/LAUNCH_CHECKLIST.md` still describes that future step.

## G. Microsoft package

There is no MSIX project. Two honest options:

1. Package the existing Electron app with a tool you already trust (`electron-builder` is **not** in `package.json` today). Add it only when you are ready to maintain a Windows installer, then sign the `.msix` with a Microsoft Store certificate.
2. Submit the installed web app as a PWA after the production site has a public HTTPS origin. The current `vite` build is a web app with a manifest. It is not a Store package.

Until one of those exists, leave `Microsoft_Store/Builds/` empty.

## H. Privacy URL and reviewer login

1. Deploy the web app to the production host you will name in the stores.
2. Confirm these URLs answer without a login:

- `https://YOUR-HOST/privacy`
- `https://YOUR-HOST/terms`
- `https://YOUR-HOST/delete-account`

3. Paste those three URLs into each `Store_Listing/listing.md`.
4. Create one demo shop in production. Put the shop name, the phone, and the 4-digit PIN in a private note, then into the Apple review notes and the Play testing instructions. Do not commit the PIN. Do not invent the account in the listing before it exists.

## I. Do not submit yet

- No signed store binary.
- No public privacy URL.
- No reviewer account.
- No Play feature graphic and no screenshots.
- MoMo Pay merchant approval is a paper application, not a live API credential.
