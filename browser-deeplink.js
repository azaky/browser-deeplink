/**
 * browser-deeplink v0.2
 *
 * Author: Ahmad Zaky
 * GitHub: http://github.com/azaky/browser-deeplink
 *
 * Forked from: http://github.com/hampusohlsson/browser-deeplink
 * and also combining https://github.com/mderazon/node-deeplink
 *
 * MIT License
 */
(function (root, factory) {
  if ( typeof define === 'function' && define.amd ) {
    define("deeplink", factory(root));
  } else if ( typeof exports === 'object' ) {
    module.exports = factory(root);
  } else {
    root["deeplink"] = factory(root);
  }
})(window || this, function (root) {
 
  "use strict"

  if (!root.document || !root.navigator) {
    throw new Error('browser-deeplink will not work without DOM or \
      user-agent');
  }

  var timeout;
  var settings = {};
  var defaults = {
    iOS: {},
    android: {},
    androidDisabled: false,
    delay: 1000,
    delayIOS: 3000
  };
  var urls = {};

  /**
   * Merge defaults with user options
   * @private
   * @param {Object} defaults Default settings
   * @param {Object} options User options
   * @returns {Object} Merged values of defaults and options
   */
  var extend = function (defaults, options) {
    var extended = {};
    for (var key in defaults) {
      extended[key] = defaults[key];
    };
    for (var key in options) {
      extended[key] = options[key];
    };
    return extended;
  };

  /**
   * Generate the app store link for iOS / Apple app store
   *
   * @private
   * @returns {String} App store itms-apps:// link 
   */
  var getStoreURLiOS = function () {
    var baseurl = "http://itunes.com/app/";
    var name = settings.iOS.appName;
    return name ? (baseurl + name) : null;
  }

  /**
   * Generate the app store link for Google Play
   *
   * @private
   * @returns {String} Play store https:// link
   */
  var getStoreURLAndroid = function () {
    var baseurl = "market://details?id=";
    var id = settings.android.appId;
    return id ? (baseurl + id) : null;        
  }

  /**
   * Get app store link, depending on the current platform
   *
   * @private
   * @returns {String} url
   */
  var getStoreLink = function () {
    var linkmap = {
      "ios": settings.iOS.storeUrl || getStoreURLiOS(),
      "android": settings.android.storeUrl || getStoreURLAndroid()
    }

    return linkmap[settings.platform];
  }

  /**
   * Check if the user-agent is Android
   *
   * @private
   * @returns {Boolean} true/false
   */
  var isAndroid = function () {
    return navigator.userAgent.match('Android');
  }

  /**
   * Check if the user-agent is iPad/iPhone/iPod
   *
   * @private
   * @returns {Boolean} true/false
   */
  var isIOS = function () {
    return navigator.userAgent.match('iPad') || 
         navigator.userAgent.match('iPhone') || 
         navigator.userAgent.match('iPod');
  }

  /**
   * Check if the user is on mobile
   *
   * @private
   * @returns {Boolean} true/false
   */
  var isMobile = function () {
    return isAndroid() || isIOS();
  }

  /**
   * The setup() function needs to be run before deeplinking can work,
   * as you have to provide the iOS and/or Android settings for your app.
   *
   * @public
   * @param {object} setup options
   */
  var setup = function (options) {
    settings = extend(defaults, options);

    if (isAndroid()) settings.platform = "android";
    if (isIOS()) settings.platform = "ios";
  }

  var parseUrl = function (uri) {
    if (typeof uri !== 'string') {
      return false;
    }

    var matches = uri.match(/([^:]+):\/\/(.+)$/i);
    if (!matches) {
      return false;
    } else {
      return {
        scheme: matches[1],
        link: matches[2]
      };
    }
  }

  var getIntentSchema = function (url, appId) {
    var parsedUrl = parseUrl(url);
    if (!parsedUrl) {
      return false;
    } else {
      return "intent://" + parsedUrl.link + "#Intent;scheme=" + parsedUrl.scheme
          + ";package=" + appId + ";end";
    }
  }

  var deeplink = function(options, callback) {
    setup(options);
    if (typeof callback !== 'function') {
      callback = function () {};
    }

    if (isMobile()) {
      if (isAndroid()) {
        if (!deeplinkAndroid()) {
          callback();
        }
      } else if (isIOS()) {
        if (!deeplinkIOS()) {
          callback();
        }
      }
    } else {
      callback();
    }
  }

  var deeplinkIOS = function () {
    var url = settings.url;
    if (!!settings.delayIOS) {
      settings.delay = settings.delayIOS;
    }
    // run preferred method first
    if (typeof settings.method === 'string') {
      if (settings.method === 'direct') {
        launchDirectApproach(url);
      } else if (settings.method === 'webkit') {
        launchWebkitApproach(url, getStoreURLiOS());
      } else if (settings.method === 'iframe') {
        launchIframeApproach(url, getStoreURLiOS());
      } else {
        throw new Error('unknown method: ' + settings.method);
      }
      return true;
    }
    // Chrome and Safari on IOS-9 don't allow the iframe approach
    if (navigator.userAgent.match(/CriOS/) ||
        (navigator.userAgent.match(/Safari/) && 
        navigator.userAgent.match(/(Version\/9)|(OS 9)/))) {
      launchWebkitApproach(url, getStoreURLiOS());
    } else {
      launchIframeApproach(url, getStoreURLiOS());
    }
    return true;
  }

  var deeplinkAndroid = function () {
    var url = settings.url;
    // no point trying in Opera
    if (navigator.userAgent.match(/OPR|Opera/)) {
      document.location = getStoreURLAndroid();
      return true;
    }
    if (!navigator.userAgent.match(/OPR|Opera/) && 
        navigator.userAgent.match(/Chrome|Firefox|Safari/) || settings.intent) {
      url = getIntentSchema(url, settings.android.appId);
      if (!url) {
        return false;
      }
    }
    // run preferred method first
    if (typeof settings.method === 'string') {
      if (settings.method === 'direct') {
        launchDirectApproach(url);
      } else if (settings.method === 'webkit') {
        launchWebkitApproach(url, getStoreURLAndroid());
      } else if (settings.method === 'iframe') {
        launchIframeApproach(url, getStoreURLAndroid());
      } else {
        throw new Error('unknown method: ' + settings.method);
      }
      return true;
    }
    if (navigator.userAgent.match(/Chrome/)) {
      launchDirectApproach(url);
    } else {
      launchIframeApproach(url, getStoreURLAndroid());
    }
    return true;
  }

  var launchDirectApproach = function (url, fallback) {
    document.location = url;
  }

  var launchWebkitApproach = function (url, fallback) {
    document.location = url;
    setTimeout(function () {
      document.location = fallback;
    }, settings.delay);
  }

  var launchIframeApproach = function (url, fallback) {
    var iframe = document.createElement("iframe");
    var timeout = setTimeout(function () {
      document.location = fallback;
    }, settings.delay);
    iframe.onload = function () {
      clearTimeout(timeout);
      iframe.parentNode.removeChild(iframe);
      window.location.href = uri;
    };
    iframe.src = url;
    iframe.style.display = "none";
    document.body.appendChild(iframe);
  }

  return deeplink;

});
