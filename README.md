## Created with Capacitor Create App

This app was created using [`@capacitor/create-app`](https://github.com/ionic-team/create-capacitor-app),
and comes with a very minimal shell for building an app.

### Running this example

To run the provided example, you can use `npm start` command.

```bash
npm start
```

### iOS release approval checklist

- Pause TestFlight rollout until purchase/auth fixes are verified.
- iOS must use Apple IAP only for digital access (no web checkout fallback).
- Paywall pricing must come from App Store product metadata.
- Purchase/Restore must always exit loading with success, error, or cancelled message.
- Universal Links require:
  - iOS Associated Domains capability (`applinks:automanagevm.app`, `applinks:auth.automanagevm.app`)
  - Hosted `/.well-known/apple-app-site-association` with appID `89UG4H5N4V.com.automanage.app`
- Before submission verify App Store Connect agreements/tax/banking, product IDs, and sandbox users.
- Run end-to-end TestFlight QA: signup → verify email → return to app → login → purchase → relaunch → restore.
- Submit a new build only after QA passes, with App Review notes describing IAP entry and Restore location.
