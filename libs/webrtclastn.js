(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.LastN = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty;

//
// We store our EE objects in a plain object whose properties are event names.
// If `Object.create(null)` is not supported we prefix the event names with a
// `~` to make sure that the built-in object properties are not overridden or
// used as an attack vector.
// We also assume that `Object.create(null)` is available when the event name
// is an ES6 Symbol.
//
var prefix = typeof Object.create !== 'function' ? '~' : false;

/**
 * Representation of a single EventEmitter function.
 *
 * @param {Function} fn Event handler to be called.
 * @param {Mixed} context Context for function execution.
 * @param {Boolean} [once=false] Only emit once
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal EventEmitter interface that is molded against the Node.js
 * EventEmitter interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() { /* Nothing to set */ }

/**
 * Hold the assigned EventEmitters by name.
 *
 * @type {Object}
 * @private
 */
EventEmitter.prototype._events = undefined;

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var events = this._events
    , names = []
    , name;

  if (!events) return names;

  for (name in events) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return a list of assigned event listeners.
 *
 * @param {String} event The events that should be listed.
 * @param {Boolean} exists We only need to know if there are listeners.
 * @returns {Array|Boolean}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event, exists) {
  var evt = prefix ? prefix + event : event
    , available = this._events && this._events[evt];

  if (exists) return !!available;
  if (!available) return [];
  if (available.fn) return [available.fn];

  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
    ee[i] = available[i].fn;
  }

  return ee;
};

/**
 * Emit an event to all registered event listeners.
 *
 * @param {String} event The name of the event.
 * @returns {Boolean} Indication if we've emitted an event.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events || !this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if ('function' === typeof listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Register a new EventListener for the given event.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} [context=this] The context of the function.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this)
    , evt = prefix ? prefix + event : event;

  if (!this._events) this._events = prefix ? {} : Object.create(null);
  if (!this._events[evt]) this._events[evt] = listener;
  else {
    if (!this._events[evt].fn) this._events[evt].push(listener);
    else this._events[evt] = [
      this._events[evt], listener
    ];
  }

  return this;
};

/**
 * Add an EventListener that's only called once.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} [context=this] The context of the function.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true)
    , evt = prefix ? prefix + event : event;

  if (!this._events) this._events = prefix ? {} : Object.create(null);
  if (!this._events[evt]) this._events[evt] = listener;
  else {
    if (!this._events[evt].fn) this._events[evt].push(listener);
    else this._events[evt] = [
      this._events[evt], listener
    ];
  }

  return this;
};

/**
 * Remove event listeners.
 *
 * @param {String} event The event we want to remove.
 * @param {Function} fn The listener that we need to find.
 * @param {Mixed} context Only remove listeners matching this context.
 * @param {Boolean} once Only remove once listeners.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events || !this._events[evt]) return this;

  var listeners = this._events[evt]
    , events = [];

  if (fn) {
    if (listeners.fn) {
      if (
           listeners.fn !== fn
        || (once && !listeners.once)
        || (context && listeners.context !== context)
      ) {
        events.push(listeners);
      }
    } else {
      for (var i = 0, length = listeners.length; i < length; i++) {
        if (
             listeners[i].fn !== fn
          || (once && !listeners[i].once)
          || (context && listeners[i].context !== context)
        ) {
          events.push(listeners[i]);
        }
      }
    }
  }

  //
  // Reset the array, or remove it completely if we have no more listeners.
  //
  if (events.length) {
    this._events[evt] = events.length === 1 ? events[0] : events;
  } else {
    delete this._events[evt];
  }

  return this;
};

/**
 * Remove all listeners or only the listeners for the specified event.
 *
 * @param {String} event The event want to remove all listeners for.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  if (!this._events) return this;

  if (event) delete this._events[prefix ? prefix + event : event];
  else this._events = prefix ? {} : Object.create(null);

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],2:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require('eventemitter3');

/**
 * Analyses mediastreams to tell you when someone new is speaking.
 * @extends EventEmitter
 */

var LastN = function (_EventEmitter) {
  _inherits(LastN, _EventEmitter);

  /**
   * Analyses stream volume.
   * @param {object} [options]
   * @param {number} [options.msBetweenAnalyse=100] - The interval in ms at which stream volumes are analysed.
   * @param {number} [options.minVolumeThreshold=0.4] - Threshold of volume for speaker change to work to deal with ambient noise. Must be a number between 0 and 1.
   * @param {number} [options.minTimeBetweenSpeakers=3000] - Minimum time in ms between newSpeaker events.
   */

  function LastN() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, LastN);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(LastN).call(this));

    var defaultParams = {
      msBetweenAnalyse: 100,
      minVolumeThreshold: .4,
      minTimeBetweenSpeakers: 3000
    };

    options = Object.assign({}, defaultParams, options);

    _this._minVolumeThreshold = Math.max(Math.min(options.minVolumeThreshold, 1), 0);
    _this._minTimeBetweenSpeakers = options.minTimeBetweenSpeakers;
    _this._msBetweenAnalyse = options.msBetweenAnalyse;

    _this._streamAnalysers = {};
    _this._analyseInterval = null;
    _this._lastActive = null;
    _this._lastChangeTime = 0;
    return _this;
  }

  /**
   * Add a MediaStream to the analysis.
   * @param {MediaStream} stream - The stream to analyse.
   * @param {string} [id=stream.id] - A unique id to identify the speaker. Will be emitted in the newSpeaker event.
   */


  _createClass(LastN, [{
    key: 'analyseMediaStream',
    value: function analyseMediaStream(stream, id) {
      id = id || stream.id;

      var context = new AudioContext();

      var source = context.createMediaStreamSource(stream);
      var analyser = context.createAnalyser();

      analyser.minDecibels = -140;
      analyser.maxDecibels = 0;

      var freqs = new Uint8Array(analyser.frequencyBinCount);

      source.connect(analyser);

      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 2048;

      var gainNode = context.createGain();
      gainNode.connect(context.destination);
      gainNode.gain.value = 0;

      this._streamAnalysers[id] = {
        context: context,
        analyser: analyser,
        freqs: freqs
      };
    }

    /**
     * Stop analysing a MediaStream
     * @param {string} id - The speaker id.
     */

  }, {
    key: 'removeMediaStream',
    value: function removeMediaStream(id) {
      this._streamAnalysers[id].context.stop();
      delete this._streamAnalysers[id];
    }
  }, {
    key: '_analyse',
    value: function _analyse() {
      var _this2 = this;

      if (Date.now() < this._lastChangeTime + this._minTimeBetweenSpeakers) {
        return;
      }

      var maxVolume = -1;
      var speaker = void 0;
      Object.keys(this._streamAnalysers).forEach(function (id) {
        var analyser = _this2._streamAnalysers[id].analyser;
        var freqs = _this2._streamAnalysers[id].freqs;
        analyser.getByteFrequencyData(freqs);

        var volume = freqs.reduce(function (a, b) {
          return a + b;
        }, 0) / (freqs.length || 1);
        //console.log(`${id} volume is ${volume}`);

        if (volume > maxVolume && volume >= _this2._minVolumeThreshold * 128) {
          speaker = id;
          maxVolume = volume;
        }
      });

      if (speaker && speaker !== this._lastActive) {
        this._lastActive = speaker;
        this._lastChangeTime = Date.now();
        this.emit('newSpeaker', speaker);
      }
    }
  }, {
    key: 'start',


    /**
     * Start analysing the MediaStreams.
     */
    value: function start() {
      var _this3 = this;

      if (!this._analyseInterval) {
        this._analyseInterval = setInterval(function () {
          _this3._analyse();
        }, this._msBetweenAnalyse);
      }
    }

    /**
     * Stop analysing the MediaStreams.
     */

  }, {
    key: 'stop',
    value: function stop() {
      clearInterval(this._analyseInterval);
      this._analyseInterval = null;
    }

    /**
     * New speaker event.
     * @event LastN#newSpeaker
     * @param {string} id - The speaker's id.
     */

  }]);

  return LastN;
}(EventEmitter);

module.exports = LastN;

},{"eventemitter3":1}]},{},[2])(2)
});
