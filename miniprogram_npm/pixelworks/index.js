module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = { exports: {} }; __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); if(typeof m.exports === "object") { __MODS__[modId].m.exports.__proto__ = m.exports.__proto__; Object.keys(m.exports).forEach(function(k) { __MODS__[modId].m.exports[k] = m.exports[k]; var desp = Object.getOwnPropertyDescriptor(m.exports, k); if(desp && desp.configurable) Object.defineProperty(m.exports, k, { set: function(val) { __MODS__[modId].m.exports[k] = val; }, get: function() { return __MODS__[modId].m.exports[k]; } }); }); if(m.exports.__esModule) Object.defineProperty(__MODS__[modId].m.exports, "__esModule", { value: true }); } else { __MODS__[modId].m.exports = m.exports; } } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1589158774503, function(require, module, exports) {
var Processor = require('./processor');

exports.Processor = Processor;

}, function(modId) {var map = {"./processor":1589158774504}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1589158774504, function(require, module, exports) {
var newImageData = require('./util').newImageData;

/**
 * Create a function for running operations.  This function is serialized for
 * use in a worker.
 * @param {function(Array, Object):*} operation The operation.
 * @return {function(Object):ArrayBuffer} A function that takes an object with
 * buffers, meta, imageOps, width, and height properties and returns an array
 * buffer.
 */
function createMinion(operation) {
  var workerHasImageData = true;
  try {
    new ImageData(10, 10);
  } catch (_) {
    workerHasImageData = false;
  }

  function newWorkerImageData(data, width, height) {
    if (workerHasImageData) {
      return new ImageData(data, width, height);
    } else {
      return {data: data, width: width, height: height};
    }
  }

  return function(data) {
    // bracket notation for minification support
    var buffers = data['buffers'];
    var meta = data['meta'];
    var imageOps = data['imageOps'];
    var width = data['width'];
    var height = data['height'];

    var numBuffers = buffers.length;
    var numBytes = buffers[0].byteLength;
    var output, b;

    if (imageOps) {
      var images = new Array(numBuffers);
      for (b = 0; b < numBuffers; ++b) {
        images[b] = newWorkerImageData(
            new Uint8ClampedArray(buffers[b]), width, height);
      }
      output = operation(images, meta).data;
    } else {
      output = new Uint8ClampedArray(numBytes);
      var arrays = new Array(numBuffers);
      var pixels = new Array(numBuffers);
      for (b = 0; b < numBuffers; ++b) {
        arrays[b] = new Uint8ClampedArray(buffers[b]);
        pixels[b] = [0, 0, 0, 0];
      }
      for (var i = 0; i < numBytes; i += 4) {
        for (var j = 0; j < numBuffers; ++j) {
          var array = arrays[j];
          pixels[j][0] = array[i];
          pixels[j][1] = array[i + 1];
          pixels[j][2] = array[i + 2];
          pixels[j][3] = array[i + 3];
        }
        var pixel = operation(pixels, meta);
        output[i] = pixel[0];
        output[i + 1] = pixel[1];
        output[i + 2] = pixel[2];
        output[i + 3] = pixel[3];
      }
    }
    return output.buffer;
  };
}

/**
 * Create a worker for running operations.
 * @param {Object} config Configuration.
 * @param {function(MessageEvent)} onMessage Called with a message event.
 * @return {Worker} The worker.
 */
function createWorker(config, onMessage) {
  var lib = Object.keys(config.lib || {}).map(function(name) {
    return 'var ' + name + ' = ' + config.lib[name].toString() + ';';
  });

  var lines = lib.concat([
    'var __minion__ = (' + createMinion.toString() + ')(', config.operation.toString(), ');',
    'self.addEventListener("message", function(event) {',
    '  var buffer = __minion__(event.data);',
    '  self.postMessage({buffer: buffer, meta: event.data.meta}, [buffer]);',
    '});'
  ]);

  var blob = new Blob(lines, {type: 'text/javascript'});
  var source = URL.createObjectURL(blob);
  var worker = new Worker(source);
  worker.addEventListener('message', onMessage);
  return worker;
}

/**
 * Create a faux worker for running operations.
 * @param {Object} config Configuration.
 * @param {function(MessageEvent)} onMessage Called with a message event.
 * @return {Object} The faux worker.
 */
function createFauxWorker(config, onMessage) {
  var minion = createMinion(config.operation);
  return {
    postMessage: function(data) {
      setTimeout(function() {
        onMessage({'data': {'buffer': minion(data), 'meta': data['meta']}});
      }, 0);
    }
  };
}

/**
 * A processor runs pixel or image operations in workers.
 * @param {Object} config Configuration.
 */
function Processor(config) {
  this._imageOps = !!config.imageOps;
  var threads;
  if (config.threads === 0) {
    threads = 0;
  } else if (this._imageOps) {
    threads = 1;
  } else {
    threads = config.threads || 1;
  }
  var workers = [];
  if (threads) {
    for (var i = 0; i < threads; ++i) {
      workers[i] = createWorker(config, this._onWorkerMessage.bind(this, i));
    }
  } else {
    workers[0] = createFauxWorker(config, this._onWorkerMessage.bind(this, 0));
  }
  this._workers = workers;
  this._queue = [];
  this._maxQueueLength = config.queue || Infinity;
  this._running = 0;
  this._dataLookup = {};
  this._job = null;
}

/**
 * Run operation on input data.
 * @param {Array.<Array|ImageData>} inputs Array of pixels or image data
 *     (depending on the operation type).
 * @param {Object} meta A user data object.  This is passed to all operations
 *     and must be serializable.
 * @param {function(Error, ImageData, Object)} callback Called when work
 *     completes.  The first argument is any error.  The second is the ImageData
 *     generated by operations.  The third is the user data object.
 */
Processor.prototype.process = function(inputs, meta, callback) {
  this._enqueue({
    inputs: inputs,
    meta: meta,
    callback: callback
  });
  this._dispatch();
};

/**
 * Stop responding to any completed work and destroy the processor.
 */
Processor.prototype.destroy = function() {
  for (var key in this) {
    this[key] = null;
  }
  this._destroyed = true;
};

/**
 * Add a job to the queue.
 * @param {Object} job The job.
 */
Processor.prototype._enqueue = function(job) {
  this._queue.push(job);
  while (this._queue.length > this._maxQueueLength) {
    this._queue.shift().callback(null, null);
  }
};

/**
 * Dispatch a job.
 */
Processor.prototype._dispatch = function() {
  if (this._running === 0 && this._queue.length > 0) {
    var job = this._job = this._queue.shift();
    var width = job.inputs[0].width;
    var height = job.inputs[0].height;
    var buffers = job.inputs.map(function(input) {
      return input.data.buffer;
    });
    var threads = this._workers.length;
    this._running = threads;
    if (threads === 1) {
      this._workers[0].postMessage({
        'buffers': buffers,
        'meta': job.meta,
        'imageOps': this._imageOps,
        'width': width,
        'height': height
      }, buffers);
    } else {
      var length = job.inputs[0].data.length;
      var segmentLength = 4 * Math.ceil(length / 4 / threads);
      for (var i = 0; i < threads; ++i) {
        var offset = i * segmentLength;
        var slices = [];
        for (var j = 0, jj = buffers.length; j < jj; ++j) {
          slices.push(buffers[i].slice(offset, offset + segmentLength));
        }
        this._workers[i].postMessage({
          'buffers': slices,
          'meta': job.meta,
          'imageOps': this._imageOps,
          'width': width,
          'height': height
        }, slices);
      }
    }
  }
};

/**
 * Handle messages from the worker.
 * @param {number} index The worker index.
 * @param {MessageEvent} event The message event.
 */
Processor.prototype._onWorkerMessage = function(index, event) {
  if (this._destroyed) {
    return;
  }
  this._dataLookup[index] = event.data;
  --this._running;
  if (this._running === 0) {
    this._resolveJob();
  }
};

/**
 * Resolve a job.  If there are no more worker threads, the processor callback
 * will be called.
 */
Processor.prototype._resolveJob = function() {
  var job = this._job;
  var threads = this._workers.length;
  var data, meta;
  if (threads === 1) {
    data = new Uint8ClampedArray(this._dataLookup[0]['buffer']);
    meta = this._dataLookup[0]['meta'];
  } else {
    var length = job.inputs[0].data.length;
    data = new Uint8ClampedArray(length);
    meta = new Array(length);
    var segmentLength = 4 * Math.ceil(length / 4 / threads);
    for (var i = 0; i < threads; ++i) {
      var buffer = this._dataLookup[i]['buffer'];
      var offset = i * segmentLength;
      data.set(new Uint8ClampedArray(buffer), offset);
      meta[i] = this._dataLookup[i]['meta'];
    }
  }
  this._job = null;
  this._dataLookup = {};
  job.callback(null,
      newImageData(data, job.inputs[0].width, job.inputs[0].height), meta);
  this._dispatch();
};

module.exports = Processor;

}, function(modId) { var map = {"./util":1589158774505}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1589158774505, function(require, module, exports) {
var hasImageData = true;
try {
  new ImageData(10, 10);
} catch (_) {
  hasImageData = false;
}

var context = document.createElement('canvas').getContext('2d');

function newImageData(data, width, height) {
  if (hasImageData) {
    return new ImageData(data, width, height);
  } else {
    var imageData = context.createImageData(width, height);
    imageData.data.set(data);
    return imageData;
  }
}

exports.newImageData = newImageData;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1589158774503);
})()
//# sourceMappingURL=index.js.map