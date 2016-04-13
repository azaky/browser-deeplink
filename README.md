browser-deeplink
================

Redirect your website users to your native Android and/or iOS app. If the user does not have the app, they are redirected to the corresponding app store page. 

Such functionality is very common for apps like YouTube, Spotify etc. But it is not default functionality in mobile browsers today, and unnecessarily hard to implement. This plugin uses a workaround with a hidden `iframe` and `setTimeout()`.

How to use

### 1. Include browser-deeplink on your site.

```html
<script src="browser-deeplink[.min].js" type="text/javascript"></script>
```

### 2. Call the deeplink

```js
deeplink({
    iOS: {
        appName: "facebook",
        storeUrl: "http://itunes.com/apps/facebook"
    },
    android: {
        appId: "com.facebook.katana",
        storeUrl: "https://play.google.com/store/apps/details?id=com.facebook.katana"
    },
    delay: 1000, // in milliseconds
    delayIOS: 3000, // in milliseconds
}, function () { // this will be called if deeplinking failed or device is not mobile
    alert('this is not a mobile device!');
});
```

`storeUrl` links will be called if the app is not installed in the device. Those fields are actually optionals, because browser-deeplink will automatically create the following fallback app store links if they are not present:

**iOS:** `http://itunes.com/apps/<appName>`
**Android:** `https://play.google.com/store/apps/details?id=<appId>`

**Notes for iOS 9:** The behavior is a little bit different. A popup message will show up, either a confirmation to open the app, or error message if the app is not installed. This is normal, and after `delayIOS` milliseconds the user will be redirected to `storeUrl`. That's why delay for iOS should be longer than default delay. The default value for `delay` is 1000 and `delayIOS` is 3000 ms.

# Source
This library is forked from [hampusohlsson/browser-deeplink](https://github.com/hampusohlsson/browser-deeplink), and also taking works of [mderazon/node-deeplink](https://github.com/mderazon/node-deeplink)

# License
This library is released under the MIT licence.
