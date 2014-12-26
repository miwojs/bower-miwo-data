(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var BaseManager;

BaseManager = (function() {
  BaseManager.prototype.types = null;

  BaseManager.prototype.items = null;

  function BaseManager() {
    this.types = {};
    this.items = {};
  }

  BaseManager.prototype.define = function(name, klass) {
    if (!Type.isFunction(klass)) {
      throw new Error("Bad defined type '" + name + "' in '" + this + "'. Class is not function");
    }
    this.types[name] = klass;
    return this;
  };

  BaseManager.prototype.register = function(name, object) {
    this.items[name] = object;
    return this;
  };

  BaseManager.prototype.unregister = function(name) {
    delete this.items[name];
    return this;
  };

  BaseManager.prototype.has = function(name) {
    return this.items[name] !== void 0;
  };

  BaseManager.prototype.get = function(name) {
    if (!this.items[name]) {
      this.register(name, this.create(name));
    }
    return this.items[name];
  };

  BaseManager.prototype.create = function(name, config) {
    if (!this.types[name]) {
      throw new Error("Undefined type '" + name + "' in " + this);
    }
    return new this.types[name](config);
  };

  BaseManager.prototype.toString = function() {
    return this.constructor.name;
  };

  return BaseManager;

})();

module.exports = BaseManager;


},{}],2:[function(require,module,exports){
var DataExtension, EntityManager, ProxyManager, StoreManager,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

StoreManager = require('./StoreManager');

ProxyManager = require('./ProxyManager');

EntityManager = require('./EntityManager');

DataExtension = (function(_super) {
  __extends(DataExtension, _super);

  function DataExtension() {
    return DataExtension.__super__.constructor.apply(this, arguments);
  }

  DataExtension.prototype.init = function() {
    this.setConfig({
      stores: {},
      entities: {}
    });
  };

  DataExtension.prototype.build = function(injector) {
    var namespace;
    namespace = window[injector.params.namespace];
    if (!namespace.entity) {
      namespace.entity = {};
    }
    if (!namespace.store) {
      namespace.store = {};
    }
    injector.define('storeMgr', StoreManager, (function(_this) {
      return function(service) {
        var name, store, _ref;
        _ref = _this.config.stores;
        for (name in _ref) {
          store = _ref[name];
          service.define(name, store);
          namespace.store[name.capitalize()] = store;
        }
      };
    })(this));
    injector.define('entityMgr', EntityManager, (function(_this) {
      return function(service) {
        var entity, name, _ref;
        _ref = _this.config.entities;
        for (name in _ref) {
          entity = _ref[name];
          service.define(name, entity);
          namespace.entity[name.capitalize()] = entity;
        }
      };
    })(this));
    injector.define('proxyMgr', ProxyManager, (function(_this) {
      return function(service) {
        var entity, name, _ref;
        _ref = _this.config.entities;
        for (name in _ref) {
          entity = _ref[name];
          if (entity.proxy) {
            service.define(name, entity.proxy);
            entity.proxy = name;
          }
        }
      };
    })(this));
  };

  return DataExtension;

})(Miwo.di.InjectorExtension);

module.exports = DataExtension;


},{"./EntityManager":4,"./ProxyManager":8,"./StoreManager":13}],3:[function(require,module,exports){
var Entity, EntityManager, Record, Store,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Record = require('./Record');

Store = require('./Store');

EntityManager = require('./EntityManager');

Entity = (function(_super) {
  __extends(Entity, _super);

  function Entity() {
    return Entity.__super__.constructor.apply(this, arguments);
  }

  Entity.prototype.collections = null;

  Entity.prototype.entities = null;

  Entity.collection = function(name, config) {
    var ownerName, relatedPrototype;
    if (this.prototype[name]) {
      throw new Error("Property " + name + " is already defined. Please use other collection name");
    }
    if (!this.prototype._collections) {
      this.prototype._collections = {};
    }
    this.prototype._collections[name] = config;
    Object.defineProperty(this.prototype, name, {
      get: function() {
        return this.getCollection(name);
      }
    });
    ownerName = this.prototype.constructor.name;
    relatedPrototype = config.type.prototype;
    if (!relatedPrototype._entities) {
      relatedPrototype._entities = {};
    }
    relatedPrototype._entities[ownerName] = {
      type: this.prototype.constructor
    };
    relatedPrototype['get' + ownerName.capitalize()] = function(callback) {
      this.getEntity(ownerName, callback);
    };
  };

  Entity.prototype.setup = function(data) {
    var collection, config, name, values, _ref, _ref1;
    Entity.__super__.setup.call(this, data);
    if (this._collections) {
      this.collections = {};
      _ref = this._collections;
      for (name in _ref) {
        config = _ref[name];
        this.collections[name] = new Store({
          entity: config.type
        });
      }
      _ref1 = this.collections;
      for (name in _ref1) {
        collection = _ref1[name];
        values = data[name] || [];
        collection.loadData(values);
      }
    }
  };

  Entity.prototype.copy = function(source) {
    Entity.__super__.copy.call(this, source);
  };

  Entity.prototype.getCollection = function(name) {
    return this.collections[name];
  };

  Entity.prototype.getEntity = function(name, callback) {
    if (!this.entities) {
      this.entities = {};
    }
    if (!this.entities[name]) {
      this.entities[name] = new this._entities[name].type();
    }
    this.entities[name].load(this.get(name + 'Id'), callback);
  };

  Entity.prototype.save = function(callback) {
    EntityManager.save(this, callback);
  };

  return Entity;

})(Record);

module.exports = Entity;


},{"./EntityManager":4,"./Record":9,"./Store":11}],4:[function(require,module,exports){
var BaseManager, Entity, EntityManager,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseManager = require('./BaseManager');

Entity = require('./Entity');

EntityManager = (function(_super) {
  __extends(EntityManager, _super);

  function EntityManager() {
    return EntityManager.__super__.constructor.apply(this, arguments);
  }

  EntityManager.prototype.proxyKlass = null;

  EntityManager.prototype.setProxy = function(proxyKlass) {
    this.proxyKlass = proxyKlass;
    return this;
  };

  EntityManager.prototype.get = function(name) {
    return this.items[name];
  };

  EntityManager.prototype.load = function(entity, id, callback) {};

  EntityManager.prototype.save = function(entity, callback) {};

  EntityManager.prototype.create = function(name, config) {
    var entity;
    if (Type.isString(name)) {
      entity = EntityManager.__super__.create.call(this, name, config);
    } else if (Type.isFunction(name)) {
      entity = new name(config);
    } else {
      throw new Error("Cant create entity, parameter name must by string or function, you put: " + (typeof name));
    }
    return entity;
  };

  EntityManager.prototype.createEntityClass = function(config) {
    var field, klass, obj, _ref;
    klass = (function(_super1) {
      __extends(_Class, _super1);

      function _Class() {
        return _Class.__super__.constructor.apply(this, arguments);
      }

      _Class.prototype.idProperty = config.idProperty;

      return _Class;

    })(Entity);
    _ref = config.fields;
    for (field in _ref) {
      obj = _ref[field];
      klass.field(field, obj);
    }
    return klass;
  };

  return EntityManager;

})(BaseManager);

module.exports = EntityManager;


},{"./BaseManager":1,"./Entity":3}],5:[function(require,module,exports){
var Filter;

Filter = (function() {
  Filter.prototype.name = null;

  Filter.prototype.type = "string";

  Filter.prototype.operation = "=";

  Filter.prototype.value = null;

  Filter.prototype.params = null;

  function Filter(config) {
    if (config == null) {
      config = {};
    }
    Object.expand(this, config);
    if (this.operation === "in" || this.operation === "!in") {
      this.value = this.value.split(",");
    }
    return;
  }

  Filter.prototype.match = function(record) {
    var val;
    if (this.type === "callback") {
      return this.operation(record, this.value);
    } else if (this.type === "string") {
      val = record.get(this.name);
      switch (this.operation) {
        case "=":
          return val === this.value;
        case "!=":
          return val !== this.value;
        case "in":
          return this.value.indexOf(val) >= 0;
        case "!in":
          return this.value.indexOf(val) < 0;
        case "!empty":
          return !!val;
        case "empty":
          return !val;
      }
      return false;
    }
    return null;
  };

  Filter.prototype.toData = function() {
    return {
      name: this.name,
      value: this.value,
      type: this.type,
      operation: this.operation,
      params: JSON.encode(this.params)
    };
  };

  return Filter;

})();

module.exports = Filter;


},{}],6:[function(require,module,exports){
var Operation, Record,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Record = require('./Record');

Operation = (function(_super) {
  __extends(Operation, _super);


  /**
  	  @cfg {String} async
  	  Execute this operation asynchronously. Defaults by proxy settings
   */

  Operation.prototype.async = undefined;


  /**
  	  @cfg {String} action
  	  The action being performed by this Operation. Should be one of 'create', 'read', 'update' or 'destroy'.
   */

  Operation.prototype.action = undefined;


  /**
  	  @cfg {Miwo.data.Filter[]} filters
  	  Optional array of filter objects. Only applies to 'read' actions.
   */

  Operation.prototype.filters = undefined;


  /**
  	  @cfg {Miwo.data.Sorter[]} sorters
  	  Optional array of sorter objects. Only applies to 'read' actions.
   */

  Operation.prototype.sorters = undefined;


  /**
  	  @cfg {Number} start
  	  The start index (offset), used in paging when running a 'read' action.
   */

  Operation.prototype.offset = undefined;


  /**
  	  @cfg {Number} limit
  	  The number of records to load. Used on 'read' actions when paging is being used.
   */

  Operation.prototype.limit = undefined;


  /**
  	  @cfg {Object} params
  	  Parameters to pass along with the request when performing the operation.
   */

  Operation.prototype.params = undefined;


  /**
  	  @cfg {Function} callback
  	  Function to execute when operation completed.
  	  @cfg {Ext.data.Model[]} callback.records Array of records.
  	  @cfg {Ext.data.Operation} callback.operation The Operation itself.
  	  @cfg {Boolean} callback.success True when operation completed successfully.
   */

  Operation.prototype.callback = undefined;


  /**
  	  @property {Boolean} started
  	  The start status of this Operation. Use {@link #isStarted}.
  	  @readonly
  	  @private
   */

  Operation.prototype.started = false;


  /**
  	  @property {Boolean} running
  	  The run status of this Operation. Use {@link #isRunning}.
  	  @readonly
  	  @private
   */

  Operation.prototype.running = false;


  /**
  	  @property {Boolean} complete
  	  The completion status of this Operation. Use {@link #isComplete}.
  	  @readonly
  	  @private
   */

  Operation.prototype.complete = false;


  /**
  	  @property {Boolean} success
  	  Whether the Operation was successful or not. This starts as undefined and is set to true
  	  or false by the Proxy that is executing the Operation. It is also set to false by {@link #setException}. Use
  	  {@link #wasSuccessful} to query success status.
  	  @readonly
  	  @private
   */

  Operation.prototype.success = undefined;


  /**
  	  @property {Boolean} exception
  	  The exception status of this Operation. Use {@link #hasException} and see {@link #getError}.
  	  @readonly
  	  @private
   */

  Operation.prototype.exception = false;


  /**
  	  @property {String/Object} error
  	  The error object passed when {@link #setException} was called. This could be any object or primitive.
  	  @private
   */

  Operation.prototype.error = undefined;


  /**
  	  @property {String/Object} error
  	  Error code
  	  @private
   */

  Operation.prototype.code = undefined;


  /**
  	  @cfg {Miwo.data.Record[]} records
   */

  Operation.prototype.records = undefined;


  /**
  	  @property {Object} response
   */

  Operation.prototype.response = undefined;


  /**
  	  @cfg {function} recordFactory
   */

  Operation.prototype.createRecord = undefined;

  function Operation(config) {
    Operation.__super__.constructor.call(this, config);
    if (config.recordFactory) {
      this.createRecord = config.recordFactory;
    } else {
      this.createRecord = function(values) {
        return new Record(values);
      };
    }
    return;
  }


  /**
  	  Set records facotry callback
  	  @param {Function} callback
   */

  Operation.prototype.setRecordFactory = function(callback) {
    this.createRecord = callback;
  };


  /**
  	  Returns response from server (JSON object)
  	  @return {Object}
   */

  Operation.prototype.getResponse = function() {
    return this.response;
  };


  /**
  	  Returns operations records
  	  @return {Miwo.data.Record[]}
   */

  Operation.prototype.getRecords = function() {
    return this.records;
  };


  /**
  	  Returns first record in record set
  	  @return {Miwo.data.Record}
   */

  Operation.prototype.getRecord = function() {
    return (this.records && this.records.length > 0 ? this.records[0] : null);
  };


  /**
  	  Marks the Operation as completed.
   */

  Operation.prototype.setCompleted = function() {
    this.complete = true;
    this.running = false;
  };


  /**
  	  Marks the Operation as successful.
   */

  Operation.prototype.setSuccessful = function() {
    this.success = true;
  };


  /**
  	  Marks the Operation as having experienced an exception. Can be supplied with an option error message/object.
  	  @param {String/Object} error (optional) error string/object
   */

  Operation.prototype.setException = function(error, code) {
    this.exception = true;
    this.success = false;
    this.running = false;
    this.error = error;
    this.code = code;
  };


  /**
  	  Returns true if this Operation encountered an exception (see also {@link #getError})
  	  @return {Boolean} True if there was an exception
   */

  Operation.prototype.hasException = function() {
    return this.exception === true;
  };


  /**
  	  Returns the error string or object that was set using {@link #setException}
  	  @return {String/Object} The error object
   */

  Operation.prototype.getError = function() {
    return this.error;
  };


  /**
  	  Returns code
  	  @return {String/Object} The response code
   */

  Operation.prototype.getCode = function() {
    return this.code;
  };


  /**
  	  Returns true if the Operation has been started. Note that the Operation may have started AND completed, see
  	  {@link #isRunning} to test if the Operation is currently running.
  	  @return {Boolean} True if the Operation has started
   */

  Operation.prototype.isStarted = function() {
    return this.started === true;
  };


  /**
  	  Returns true if the Operation has been started but has not yet completed.
  	  @return {Boolean} True if the Operation is currently running
   */

  Operation.prototype.isRunning = function() {
    return this.running === true;
  };


  /**
  	  Returns true if the Operation has been completed
  	  @return {Boolean} True if the Operation is complete
   */

  Operation.prototype.isComplete = function() {
    return this.complete === true;
  };


  /**
  	  Returns true if the Operation has completed and was successful
  	  @return {Boolean} True if successful
   */

  Operation.prototype.wasSuccessful = function() {
    return this.isComplete() && this.success === true;
  };

  return Operation;

})(Miwo.Object);

module.exports = Operation;


},{"./Record":9}],7:[function(require,module,exports){
var Operation, Proxy,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Operation = require('./Operation');

Proxy = (function(_super) {
  __extends(Proxy, _super);

  Proxy.prototype.isProxy = true;

  Proxy.prototype.name = void 0;

  Proxy.prototype.headers = null;

  Proxy.prototype.secure = true;

  Proxy.prototype.defaults = null;

  Proxy.prototype.api = null;

  function Proxy(config) {
    this.defaults = {
      timeout: 0,
      async: true
    };
    this.api = {
      create: void 0,
      read: void 0,
      update: void 0,
      destroy: void 0
    };
    if (config.url) {
      this.api.read = this.url;
      delete config.url;
    }
    Proxy.__super__.constructor.call(this, config);
    return;
  }

  Proxy.prototype.setAsync = function(async) {
    this.defaults.async = async;
  };

  Proxy.prototype.execute = function(operations, config) {
    if (operations.destroy) {
      this.executeOperations('destroy', operations.destroy, config);
    }
    if (operations.create) {
      this.executeOperations('create', operations.create, config);
    }
    if (operations.update) {
      this.executeOperations('update', operations.update, config);
    }
  };

  Proxy.prototype.executeOperations = function(action, operations, config) {
    var opc;
    opc = Object.append({}, config);
    Object.append(opc, {
      records: operations.records
    });
    this[action](opc, operations.callback);
  };

  Proxy.prototype.read = function(config, callback) {
    this.doRequest(this.createOperation('read', config), callback);
  };

  Proxy.prototype.create = function(config, callback) {
    this.doRequest(this.createOperation('create', config), callback);
  };

  Proxy.prototype.update = function(config, callback) {
    this.doRequest(this.createOperation('update', config), callback);
  };

  Proxy.prototype.destroy = function(config, callback) {
    this.doRequest(this.createOperation('destroy', config), callback);
  };

  Proxy.prototype.createOperation = function(action, config) {
    var op;
    op = new Operation(config);
    op.action = action;
    return op;
  };

  Proxy.prototype.doRequest = function(operation, callback) {
    var options, request;
    request = miwo.http.createRequest();
    options = Object.merge({}, this.defaults);
    options.method = "POST";
    options.headers = this.headers;
    options.url = this.api[operation.action];
    options.data = this.createRequestData(operation);
    options.onComplete = function() {
      operation.setCompleted();
    };
    options.onRequest = function() {
      operation.running = true;
    };
    options.onSuccess = (function(_this) {
      return function(response) {
        _this.proccessResponse(true, operation, request, response, callback);
      };
    })(this);
    options.onFailure = (function(_this) {
      return function() {
        _this.proccessResponse(false, operation, request, null, callback);
      };
    })(this);
    if (operation.async !== void 0) {
      options.async = operation.async;
    }
    operation.started = true;
    request.setOptions(options);
    request.send();
  };

  Proxy.prototype.createRequestData = function(operation) {
    var data;
    data = {};
    data.action = operation.action;
    switch (operation.action) {
      case "create":
        data.data = this.createOperationData(operation, 'create');
        break;
      case "destroy":
        data.data = this.createOperationData(operation, 'destroy');
        break;
      case "update":
        data.data = this.createOperationData(operation, 'update');
        break;
      case "read":
        if (operation.filters) {
          data.filters = this.createItemsData(operation.filters);
        }
        if (operation.sorters) {
          data.sorters = this.createItemsData(operation.sorters);
        }
        if (operation.offset) {
          data.offset = operation.offset;
        }
        if (operation.limit) {
          data.limit = operation.limit;
        }
        if (operation.params) {
          Object.expand(data, operation.params);
        }
    }
    return data;
  };

  Proxy.prototype.createItemsData = function(items) {
    var data, item, _i, _len;
    data = [];
    for (_i = 0, _len = items.length; _i < _len; _i++) {
      item = items[_i];
      data.push(item.toData());
    }
    return data;
  };

  Proxy.prototype.createOperationData = function(operation, mode) {
    var changes, data, record, _i, _len, _ref;
    if (!operation.getRecords()) {
      throw new Error("operation has no records");
    }
    data = [];
    _ref = operation.getRecords();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      record = _ref[_i];
      if (mode === 'create') {
        data.push(record.getValues());
      } else if (mode === 'update') {
        changes = record.getChanges();
        changes[record.idProperty] = record.getId();
        data.push(changes);
      } else if (mode === 'destroy') {
        data.push(record.getId());
      }
    }
    return JSON.encode(data);
  };

  Proxy.prototype.proccessResponse = function(success, operation, request, response, callback) {
    var xhr;
    if (!success) {
      xhr = request.xhr;
      operation.setException(xhr.responseText, xhr.status);
    } else {
      if (!response.success) {
        operation.setException(response.error, response.code);
      } else {
        operation.setSuccessful();
        operation.response = response;
        this.commitOperation(operation, response.records);
      }
    }
    callback(operation);
  };

  Proxy.prototype.commitOperation = function(operation, records) {
    var data, index, record, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref;
    switch (operation.action) {
      case "create":
        for (index = _i = 0, _len = records.length; _i < _len; index = ++_i) {
          data = records[index];
          record = operation.records[index];
          record.set(data);
          record.commit();
        }
        break;
      case "update":
        for (_j = 0, _len1 = records.length; _j < _len1; _j++) {
          data = records[_j];
          _ref = operation.records;
          for (_k = 0, _len2 = _ref.length; _k < _len2; _k++) {
            record = _ref[_k];
            if (record.getId() === data.id) {
              record.set(data);
              record.commit();
              break;
            }
          }
        }
        break;
      case "read":
        operation.records = [];
        for (_l = 0, _len3 = records.length; _l < _len3; _l++) {
          data = records[_l];
          record = operation.createRecord(data);
          operation.records.push(record);
        }
    }
  };

  return Proxy;

})(Miwo.Object);

module.exports = Proxy;


},{"./Operation":6}],8:[function(require,module,exports){
var BaseManager, Proxy, ProxyManager,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseManager = require('./BaseManager');

Proxy = require('./Proxy');

ProxyManager = (function(_super) {
  __extends(ProxyManager, _super);

  function ProxyManager() {
    return ProxyManager.__super__.constructor.apply(this, arguments);
  }

  ProxyManager.prototype.define = function(name, klass) {
    if (!Type.isFunction(klass) && !Type.isObject(klass)) {
      throw new Error("Bad defined type '" + name + "' in '" + this + "'. Parameter should by function or object");
    }
    this.types[name] = klass;
    return this;
  };

  ProxyManager.prototype.create = function(name) {
    if (!this.types[name]) {
      throw new Error("Undefined type '" + name + "' in " + this);
    }
    return this.createProxy(this.types[name]);
  };

  ProxyManager.prototype.createProxy = function(config) {
    var proxy;
    if (Type.isFunction(config)) {
      proxy = new config();
    }
    if (Type.isObject(config)) {
      proxy = new Proxy(config);
    }
    if (!proxy.isProxy) {
      throw new Error("Created proxy is not instance of Miwo.data.Proxy");
    }
    return proxy;
  };

  return ProxyManager;

})(BaseManager);

module.exports = ProxyManager;


},{"./BaseManager":1,"./Proxy":7}],9:[function(require,module,exports){
var Record, Types,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

Types = require('./Types');

Record = (function(_super) {
  __extends(Record, _super);

  Record.prototype.isRecord = true;

  Record.prototype.idProperty = "id";

  Record.prototype._phantom = false;

  Record.prototype._editing = false;

  Record.prototype._dirty = false;

  Record.prototype._data = null;

  Record.prototype._modified = null;

  Record.prototype._stores = null;

  Record.prototype._store = null;

  Record.prototype._raw = null;

  Record.prototype.fields = null;

  Record.prototype._singleProp = {};

  Record.getter('phantom', function() {
    return this._phantom;
  });

  Record.field = function(name, config) {
    if (this.prototype[name]) {
      throw new Error("Property " + name + " is already used. Please use other field name");
    }
    if (!this.prototype._fields) {
      this.prototype._fields = {};
    }
    this.prototype._fields[name] = config;
    Object.defineProperty(this.prototype, name, {
      get: function() {
        return this.get(name);
      },
      set: function(value) {
        return this.set(name, value);
      }
    });
  };

  function Record(data, source) {
    if (data == null) {
      data = {};
    }
    if (source == null) {
      source = null;
    }
    this._data = {};
    this._stores = [];
    this._raw = data;
    this.fields = {};
    if (!source) {
      this.setup(data);
    } else {
      this.copy(source);
    }
    this._modified = {};
    this._dirty = false;
    this._phantom = !(this.getId() || this.getId() === 0);
    this.init();
    return;
  }

  Record.prototype.init = function() {};

  Record.prototype.setup = function(data) {
    var field, name, type, value, _ref, _ref1;
    _ref = this._fields;
    for (name in _ref) {
      field = _ref[name];
      type = field.type || "string";
      if (!Types[type]) {
        throw new Error("Record::initialize(): undefined type " + type);
      }
      this.fields[name] = Object.merge({}, Types[type], {
        name: name,
        def: (field.def !== void 0 ? field.def : null),
        nullable: (field.nullable !== void 0 ? field.nullable : null),
        persist: (field.persist !== void 0 ? field.persist : true)
      });
    }
    _ref1 = this.fields;
    for (name in _ref1) {
      field = _ref1[name];
      value = data[name];
      if (value === void 0) {
        value = field.def;
      }
      if (field.convert) {
        value = field.convert(value, this);
      }
      if (value !== void 0) {
        this._data[name] = value;
        this.onValueChanged(name, value, null);
      }
    }
  };

  Record.prototype.copy = function(source) {
    this.fields = source.fields;
    this._data = source.data;
  };


  /**
  	  Creates a copy (clone) of this Record instance.
  	  @return {Miwo.data.Record}
   */

  Record.prototype.clone = function(newId) {
    var source;
    source = Object.merge({}, {
      fields: this.fields,
      data: this._data
    });
    source.data[this.idProperty] = newId;
    return new this.constructor(this._raw, source);
  };


  /**
  	  Get value from record
  	  @param name
  	  @returns {mixed}
   */

  Record.prototype.get = function(name) {
    var getter;
    getter = "get" + name.capitalize();
    if (this[getter]) {
      return this[getter]();
    } else {
      return this._data[name];
    }
  };


  /**
  	  Sets the given field to the given value, marks the instance as dirty
  	  @param {String/Object} fieldName The field to set, or an object containing key/value pairs
  	  @param {Object} newValue The value to set
  	  @return {String[]} The array of modified field names or null if nothing was modified.
   */

  Record.prototype.set = function(fieldName, newValue) {
    var currentValue, field, idChanged, modifiedFieldNames, name, newId, oldId, single, value, values;
    single = Type.isString(fieldName);
    if (single) {
      values = this._singleProp;
      values[fieldName] = newValue;
    } else {
      values = fieldName;
    }
    for (name in values) {
      value = values[name];
      if (!this.fields[name]) {
        continue;
      }
      field = this.fields[name];
      if (field.convert) {
        value = field.convert(value, this);
      }
      currentValue = this._data[name];
      if (this.isEqual(currentValue, value)) {
        continue;
      }
      this._data[name] = value;
      this.onValueChanged(name, value, currentValue);
      (modifiedFieldNames || (modifiedFieldNames = [])).push(name);
      if (field.persist) {
        if (this._modified[name]) {
          if (this.isEqual(this._modified[name], value)) {
            delete this._modified[name];
            this._dirty = Object.getLength(this._modified) > 0;
          }
        } else {
          this._dirty = true;
          this._modified[name] = currentValue;
        }
      }
      if (name === this.idProperty) {
        idChanged = true;
        oldId = currentValue;
        newId = value;
      }
    }
    if (single) {
      delete values[fieldName];
    }
    if (idChanged) {
      this.emit("idchanged", this, oldId, newId);
    }
    if (!this._editing && modifiedFieldNames) {
      this.afterEdit(modifiedFieldNames);
    }
    return modifiedFieldNames || null;
  };

  Record.prototype.getId = function() {
    return this._data[this.idProperty];
  };

  Record.prototype.setId = function(id) {
    this.set(this.idProperty, id);
    this._phantom = !(id || id === 0);
  };

  Record.prototype.updating = function(callback) {
    var editing;
    editing = this._editing;
    if (!editing) {
      this.beginEdit();
    }
    callback(this._data);
    if (!editing) {
      this.endEdit();
    }
  };


  /**
  	  Gets all values for each field in this model and returns an object containing the current data.
  	  @return {Object} An object hash containing all the values in this model
   */

  Record.prototype.getValues = function() {
    var field, name, values, _ref;
    values = {};
    _ref = this.fields;
    for (name in _ref) {
      field = _ref[name];
      values[name] = this.get(name);
    }
    return values;
  };

  Record.prototype.beginEdit = function() {
    var key, value, _ref, _ref1;
    if (!this._editing) {
      this._editing = true;
      this._dirtySaved = this._dirty;
      this._dataSaved = {};
      this._modifiedSaved = {};
      _ref = this._data;
      for (key in _ref) {
        value = _ref[key];
        this._dataSaved[key] = value;
      }
      _ref1 = this._modified;
      for (key in _ref1) {
        value = _ref1[key];
        this._modifiedSaved[key] = value;
      }
    }
  };

  Record.prototype.cancelEdit = function() {
    if (this._editing) {
      this._editing = false;
      this._dirty = this._dirtySaved;
      this._data = this._dataSaved;
      this._modified = this._modifiedSaved;
      delete this._dirtySaved;
      delete this._dataSaved;
      delete this._modifiedSaved;
    }
  };

  Record.prototype.endEdit = function(silent, modifiedFieldNames) {
    var changed, data;
    if (silent == null) {
      silent = true;
    }
    if (this._editing) {
      this._editing = false;
      data = this._dataSaved;
      delete this._modifiedSaved;
      delete this._dataSaved;
      delete this._dirtySaved;
      if (!silent) {
        if (!modifiedFieldNames) {
          modifiedFieldNames = this.getModifiedFieldNames(data);
        }
        changed = this._dirty || modifiedFieldNames.length > 0;
        if (changed) {
          this.afterEdit(modifiedFieldNames);
        }
      }
    }
  };

  Record.prototype.getModifiedFieldNames = function(values) {
    var key, modified, value, _ref;
    modified = [];
    _ref = this._data;
    for (key in _ref) {
      value = _ref[key];
      if (!this.isEqual(value, values[key])) {
        modified.push(key);
      }
    }
    return modified;
  };

  Record.prototype.getChanges = function() {
    var changes, name, value, _ref;
    changes = {};
    _ref = this._modified;
    for (name in _ref) {
      value = _ref[name];
      changes[name] = this.get(name);
    }
    return changes;
  };

  Record.prototype.isModified = function(fieldName) {
    return this._modified.hasOwnProperty(fieldName);
  };

  Record.prototype.isEqual = function(a, b) {
    var x;
    if (Type.isObject(a) && Type.isObject(b)) {
      if (Object.getLength(a) !== Object.getLength(b)) {
        return false;
      } else {
        for (x in a) {
          if (b[x] !== a[x]) {
            return false;
          }
        }
        return true;
      }
    } else if (Type.isDate(a) && Type.isDate(b)) {
      return a.getTime() === b.getTime();
    } else {
      return a === b;
    }
  };

  Record.prototype.setDirty = function() {
    var field, name, _ref;
    this._dirty = true;
    _ref = this.fields;
    for (name in _ref) {
      field = _ref[name];
      if (field.persist) {
        this._modified[name] = this.get(name);
      }
    }
  };

  Record.prototype.reject = function(silent) {
    var name, value, _ref;
    if (silent == null) {
      silent = false;
    }
    _ref = this._modified;
    for (name in _ref) {
      value = _ref[name];
      this._data[name] = value;
    }
    this._dirty = false;
    this._editing = false;
    this._modified = {};
    if (!silent) {
      this.afterReject();
    }
  };

  Record.prototype.commit = function(silent) {
    if (silent == null) {
      silent = false;
    }
    this._phantom = this._dirty = this._editing = false;
    this._modified = {};
    if (!silent) {
      this.afterCommit();
    }
  };


  /**
  	  Tells this model instance that it has been added to a store.
  	  @param {Ext.data.Store} store The store to which this model has been added.
   */

  Record.prototype.joinStore = function(store) {
    this._stores.include(store);
    this._store = this._stores[0];
  };


  /**
  	  Tells this model instance that it has been removed from the store.
  	  @param {Ext.data.Store} store The store from which this model has been removed.
   */

  Record.prototype.unjoinStore = function(store) {
    this._stores.erase(store);
    this._store = this._stores[0] || null;
  };

  Record.prototype.isStored = function() {
    return this._store !== null;
  };

  Record.prototype.isPhantom = function() {
    return this._phantom;
  };


  /**
  	  @private
  	  If this Model instance has been {@link #join joined} to a {@link Ext.data.Store store}, the store's
  	  afterEdit method is called
  	  @param {String[]} modifiedFieldNames Array of field names changed during edit.
   */

  Record.prototype.afterEdit = function(modifiedFieldNames) {
    this.emit("edit", this, modifiedFieldNames);
    this.callStore("afterEdit", this, modifiedFieldNames);
  };

  Record.prototype.afterReject = function() {
    this.callStore("afterReject", this);
  };

  Record.prototype.afterCommit = function() {
    this.callStore("afterCommit", this);
  };

  Record.prototype.callStore = function() {
    var args, fn, store, _i, _len, _ref;
    fn = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    _ref = this._stores;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      store = _ref[_i];
      if (store[fn]) {
        store[fn].apply(store, args);
      }
    }
  };

  Record.prototype.onValueChanged = function(name, value, oldvalue) {};

  return Record;

})(Miwo.Events);

module.exports = Record;


},{"./Types":15}],10:[function(require,module,exports){
var Sorter;

Sorter = (function() {
  Sorter.prototype.name = null;

  Sorter.prototype.dir = null;

  function Sorter(config) {
    if (config == null) {
      config = {};
    }
    Object.expand(this, config);
  }

  Sorter.prototype.compare = function(a, b) {
    var aVal, bVal, sign;
    if (Type.isFunction(this.dir)) {
      return this.dir(a, b);
    } else {
      aVal = a.get(this.name);
      bVal = b.get(this.name);
      sign = (this.dir === "desc" ? -1 : 1);
      if (Type.isDate(aVal) && Type.isDate(bVal)) {
        if (aVal - bVal > 0) {
          return sign;
        }
        if (aVal - bVal < 0) {
          return -sign;
        }
      } else {
        if (aVal > bVal) {
          return sign;
        }
        if (aVal < bVal) {
          return -sign;
        }
      }
      return null;
    }
  };

  Sorter.prototype.toData = function() {
    return {
      name: this.name,
      dir: this.dir
    };
  };

  return Sorter;

})();

module.exports = Sorter;


},{}],11:[function(require,module,exports){
var Store, StoreFilters, StoreSorters,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

StoreFilters = require('./StoreFilters');

StoreSorters = require('./StoreSorters');

Store = (function(_super) {
  __extends(Store, _super);

  Store.prototype.isStore = true;

  Store.prototype.name = null;

  Store.prototype.entity = null;

  Store.prototype.fields = null;

  Store.prototype.idProperty = 'id';

  Store.prototype.data = null;

  Store.prototype.newRecords = null;

  Store.prototype.removedRecords = null;

  Store.prototype.updatedRecords = null;

  Store.prototype.autoLoad = false;

  Store.prototype.autoSync = false;

  Store.prototype.autoSyncReload = false;

  Store.prototype.autoSyncSuspended = false;

  Store.prototype.remoteFilter = false;

  Store.prototype.remoteSort = false;

  Store.prototype.proxy = null;

  Store.prototype.storeFilters = null;

  Store.prototype.filteredData = null;

  Store.prototype.filterOnLoad = true;

  Store.prototype.filterOnEdit = true;

  Store.prototype.filtered = false;

  Store.prototype.filter = null;

  Store.getter('filters', function() {
    return this.getFilters();
  });

  Store.prototype.storeSorters = null;

  Store.prototype.sortOnLoad = true;

  Store.prototype.sortOnEdit = true;

  Store.prototype.sort = null;

  Store.getter('sorters', function() {
    return this.getSorters();
  });

  Store.prototype.pageSize = null;

  Store.prototype.loading = false;

  Store.prototype.loaded = false;

  Store.prototype.totalCount = 0;

  Store.prototype.page = 1;

  Store.prototype.params = null;

  function Store(config) {
    var proxyMgr;
    if (config == null) {
      config = {};
    }
    Store.__super__.constructor.call(this, config);
    this.newRecords = [];
    this.removedRecords = [];
    this.updatedRecords = [];
    if (config.entity) {
      this.entity = config.entity;
    }
    if (!this.entity && this.fields) {
      this.entity = miwo.entityMgr.createEntityClass({
        fields: this.fields,
        idProperty: this.idProperty
      });
      delete this.fields;
      delete this.idProperty;
    }
    if (!this.entity) {
      throw new Error("Unspecified entity or fields for store " + this);
    }
    if (this.proxy) {
      proxyMgr = miwo.proxyMgr;
      if (Type.isString(this.proxy)) {
        this.proxy = proxyMgr.get(this.proxy);
      } else if (Type.isObject(this.proxy)) {
        this.proxy = proxyMgr.createProxy(this.proxy);
      }
    } else if (this.entity.proxy) {
      proxyMgr = miwo.proxyMgr;
      if (Type.isString(this.entity.proxy)) {
        this.proxy = proxyMgr.get(this.entity.proxy);
      } else if (Type.isObject(this.entity.proxy)) {
        this.proxy = proxyMgr.createProxy(this.entity.proxy);
      }
    }
    if (this.name) {
      if (!miwo.storeMgr.has(this.name)) {
        miwo.storeMgr.register(this.name, this);
      }
    }
    if (this.sort) {
      this.getSorters().set(this.sort);
    }
    if (this.filter) {
      this.getFilters().set(this.filter);
    }
    this.data = [];
    this.init();
    if (this.autoLoad) {
      this.load();
    }
  }

  Store.prototype.init = function() {};

  Store.prototype.getAll = function() {
    return this.data;
  };

  Store.prototype.getLast = function() {
    return this.data.getLast();
  };

  Store.prototype.getFirst = function() {
    return this.data[0];
  };

  Store.prototype.getCount = function() {
    return this.data.length;
  };

  Store.prototype.getAt = function(index) {
    if (index < this.data.length) {
      return this.data[index];
    } else {
      return null;
    }
  };

  Store.prototype.getById = function(id) {
    var rec, _i, _len, _ref;
    _ref = this.data;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rec = _ref[_i];
      if (rec.id == id) {
        return rec;
      }
    }
    return null;
  };

  Store.prototype.attachRecord = function(rec) {
    rec.joinStore(this);
  };

  Store.prototype.detachRecord = function(rec) {
    rec.unjoinStore(this);
  };

  Store.prototype.isLoading = function() {
    return this.loading;
  };

  Store.prototype.isFiltered = function() {
    return this.filtered;
  };

  Store.prototype.getTotalCount = function() {
    return this.totalCount;
  };

  Store.prototype.getModifiedRecords = function() {
    return [].concat(this.getNewRecords(), this.getUpdatedRecords());
  };

  Store.prototype.getNewRecords = function() {
    return this.newRecords;
  };

  Store.prototype.getRemovedRecords = function() {
    return this.removedRecords;
  };

  Store.prototype.getUpdatedRecords = function() {
    return this.updatedRecords;
  };

  Store.prototype.getRecords = function() {
    if (this.filtered) {
      return this.filteredData;
    } else {
      return this.data;
    }
  };

  Store.prototype.each = function(callback) {
    this.data.each(callback);
  };

  Store.prototype.loadRecords = function(recs, clear) {
    var rec, _i, _len;
    if (clear == null) {
      clear = false;
    }
    if (clear) {
      this.clear();
    }
    for (_i = 0, _len = recs.length; _i < _len; _i++) {
      rec = recs[_i];
      this.data.push(rec);
      this.attachRecord(rec);
    }
    if (this.sortOnLoad && !this.remoteSort && this.storeSorters && this.storeSorters.has()) {
      this.storeSorters.apply(true);
    }
    if (this.filterOnLoad && !this.remoteFilter && this.storeFilters && this.storeFilters.has()) {
      this.storeFilters.apply(true);
    }
    this.emit('datachanged', this);
  };

  Store.prototype.setData = function(data, clear) {
    var records, values, _i, _len;
    records = [];
    for (_i = 0, _len = data.length; _i < _len; _i++) {
      values = data[_i];
      records.push(this.createRecord(values));
    }
    this.loadRecords(records, clear);
  };

  Store.prototype.createRecord = function(values) {
    return miwo.entityMgr.create(this.entity, values);
  };

  Store.prototype.setProxy = function(proxy) {
    this.proxy = proxy;
  };

  Store.prototype.getProxy = function() {
    return this.proxy;
  };

  Store.prototype.indexOf = function(find, findInFiltered) {
    var index, rec, source, _i, _len;
    source = !findInFiltered || findInFiltered && !this.filtered ? this.data : this.filteredData;
    for (index = _i = 0, _len = source.length; _i < _len; index = ++_i) {
      rec = source[index];
      if (rec === find) {
        return index;
      }
    }
    return null;
  };

  Store.prototype.indexOfId = function(id) {
    var index, rec, _i, _len, _ref;
    _ref = this.data;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      rec = _ref[index];
      if (rec.getId() === id) {
        return index;
      }
    }
    return null;
  };

  Store.prototype.findAtBy = function(callback) {
    var index, rec, _i, _len, _ref;
    _ref = this.data;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      rec = _ref[index];
      if (callback(rec, index)) {
        return index;
      }
    }
    return null;
  };

  Store.prototype.findAtRecord = function(fieldName, value, op, startIndex) {
    return this.findAtBy(this.createFinderCallback(fieldName, value, op, startIndex));
  };

  Store.prototype.findAtExact = function(fieldName, value, startIndex) {
    return this.findAtRecord(fieldName, value, "===", startIndex);
  };

  Store.prototype.findBy = function(callback) {
    var rec, _i, _len, _ref;
    _ref = this.data;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rec = _ref[_i];
      if (callback(rec)) {
        return rec;
      }
    }
    return null;
  };

  Store.prototype.findRecord = function(fieldName, value, op, startIndex) {
    return this.findBy(this.createFinderCallback(fieldName, value, op, startIndex));
  };

  Store.prototype.findExact = function(fieldName, value, startIndex) {
    return this.findRecord(fieldName, value, "===", startIndex);
  };

  Store.prototype.findAllBy = function(callback) {
    var find, rec, _i, _len, _ref;
    find = [];
    _ref = this.data;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rec = _ref[_i];
      if (callback(rec)) {
        find.push(rec);
      }
    }
    return find;
  };

  Store.prototype.findAllAt = function(index, count) {
    var find, i, indexTo, rec, _i, _len, _ref;
    if (count == null) {
      count = 1;
    }
    indexTo = index + count;
    find = [];
    _ref = this.data;
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      rec = _ref[i];
      if (i >= index && i < indexTo) {
        find.push(rec);
      }
    }
    return find;
  };

  Store.prototype.findRecords = function(fieldName, value, op, startIndex) {
    return this.findAllBy(this.createFinderCallback(fieldName, value, op, startIndex));
  };

  Store.prototype.createFinderCallback = function(fieldName, value, op, startIndex) {
    if (op == null) {
      op = "?";
    }
    if (startIndex == null) {
      startIndex = null;
    }
    return (function(_this) {
      return function(rec, index) {
        var recval;
        if (startIndex === null || index >= startIndex) {
          recval = rec.get(fieldName);
          switch (op) {
            case "===":
              if (recval === value) {
                return true;
              }
              break;
            case "==":
              if (recval === value) {
                return true;
              }
              break;
            case "=":
              if (recval.toString().test(value)) {
                return true;
              }
              break;
            case "?":
              if (recval.toString().test(value, "i")) {
                return true;
              }
              break;
            default:
              throw new Error("Unknown operator " + op);
          }
        }
        return false;
      };
    })(this);
  };

  Store.prototype.add = function(recs) {
    var added, rec, _i, _len;
    recs = Array.from(recs);
    added = false;
    if (recs.length === 0) {
      return;
    }
    for (_i = 0, _len = recs.length; _i < _len; _i++) {
      rec = recs[_i];
      added = true;
      this.data.push(rec);
      this.newRecords.push(rec);
      this.removedRecords.erase(rec);
      if (this.filtered && this.getFilters().match(rec)) {
        this.filteredData.push(rec);
      }
      this.attachRecord(rec);
      this.emit('add', this, rec);
    }
    if (added) {
      this.emit('datachanged', this);
    }
  };

  Store.prototype.insert = function(index, recs, reversed) {
    var i, pos, rec, _i, _len;
    recs = Array.from(recs);
    if (recs.length === 0) {
      return;
    }
    for (i = _i = 0, _len = recs.length; _i < _len; i = ++_i) {
      rec = recs[i];
      pos = (reversed ? 0 : index + i);
      this.data.insert(pos, rec);
      this.newRecords.push(rec);
      this.removedRecords.erase(rec);
      if (this.filtered && this.getFilters().match(rec)) {
        this.filteredData.push(rec);
      }
      this.attachRecord(rec);
      this.emit('add', this, rec, pos);
    }
    this.emit("datachanged", this);
  };


  /**
  	  (Local sort only) Inserts the passed Record into the Store at the index where it
  	  should go based on the current sort information.
  	  @param {Miwo.data.Record} record
   */

  Store.prototype.addSorted = function(record) {
    var index;
    index = this.storeSorters ? this.storeSorters.getIndex(record) : this.data.length;
    this.insert(index, record);
    return record;
  };

  Store.prototype.addData = function(values) {
    var data, records, _i, _len;
    if (Type.isArray(values)) {
      records = [];
      for (_i = 0, _len = values.length; _i < _len; _i++) {
        data = values[_i];
        records.push(this.createRecord(data));
      }
      this.add(records);
    } else {
      this.add(this.createRecord(values));
    }
    return this;
  };

  Store.prototype.removeBy = function(callback) {
    this.remove(this.findAllBy(callback));
  };

  Store.prototype.removeRecord = function(field, value) {
    this.removeBy(function(rec) {
      return rec.get(field) === value;
    });
  };

  Store.prototype.removeById = function(id) {
    this.remove(this.getById(id));
  };

  Store.prototype.removeAt = function(index, count) {
    this.remove(this.findAllAt(index, count));
  };

  Store.prototype.removeAll = function(silent) {
    if (this.data.length > 0) {
      this.clear();
      this.emit("datachanged", this);
      if (!silent) {
        this.emit("removeall", this);
      }
    }
  };

  Store.prototype.remove = function(recs) {
    var changed, index, rec, _i, _len, _ref;
    changed = false;
    _ref = Array.from(recs);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rec = _ref[_i];
      rec.unjoinStore(this);
      index = this.indexOf(rec);
      this.data.erase(rec);
      this.newRecords.erase(rec);
      this.updatedRecords.erase(rec);
      this.removedRecords.include(rec);
      this.emit('remove', this, rec, index);
      if (this.filtered && this.getFilters().match(rec)) {
        this.filteredData.erase(rec);
      }
      changed = true;
    }
    if (changed) {
      this.emit("datachanged", this);
    }
  };

  Store.prototype.clear = function() {
    var rec, _i, _len, _ref;
    _ref = this.data;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rec = _ref[_i];
      rec.unjoinStore(this);
    }
    if (this.filtered) {
      this.filteredData.empty();
    }
    this.data.empty();
  };

  Store.prototype.load = function(options) {
    if (options == null) {
      options = {};
    }
    if (this.loading) {
      return;
    }
    if (!this.proxy) {
      throw new Error("Cant load data, proxy is missing in store");
    }
    options.params = Object.merge({}, this.params, options.params);
    options.offset = (options.offset !== undefined ? options.offset : (options.page ? options.page - 1 : 0) * this.pageSize);
    options.limit = options.limit || this.pageSize;
    options.filters = this.storeFilters ? this.storeFilters.getAll() : null;
    options.sorters = this.storeSorters ? this.storeSorters.getAll() : null;
    options.addRecords = options.addRecords || false;
    options.recordFactory = this.bound("createRecord");
    this.emit("beforeload", this, options);
    this.page = (this.pageSize ? Math.max(1, Math.ceil(options.offset / this.pageSize) + 1) : 1);
    this.loading = true;
    this.proxy.read(options, this.bound("onProxyLoad"));
  };

  Store.prototype.loadonce = function(options) {
    if (this.loaded) {
      return;
    }
    this.load(options);
  };

  Store.prototype.reload = function() {
    this.load({
      page: this.page
    });
  };

  Store.prototype.onProxyLoad = function(operation) {
    var records, response, successful;
    response = operation.getResponse();
    records = operation.getRecords();
    successful = operation.wasSuccessful();
    if (response) {
      this.totalCount = response.total;
    }
    if (successful) {
      this.loadRecords(records, true);
    }
    this.loading = false;
    this.loaded = true;
    this.emit("load", this, records, successful);
  };

  Store.prototype.loadPage = function(page) {
    if (!this.pageSize) {
      return;
    }
    this.page = Math.max(1, Math.min(page, Math.ceil(this.totalCount / this.pageSize)));
    this.load({
      page: this.page
    });
  };

  Store.prototype.loadPrevPage = function() {
    if (!this.pageSize) {
      return;
    }
    this.page = Math.max(1, this.page - 1);
    this.load({
      page: this.page
    });
  };

  Store.prototype.loadNextPage = function() {
    if (!this.pageSize) {
      return;
    }
    this.page = Math.min(this.page + 1, Math.ceil(this.totalCount / this.pageSize));
    this.load({
      page: this.page
    });
  };

  Store.prototype.loadNestedPage = function(type) {
    if (type === 'prev') {
      this.loadPrevPage();
    } else if (type === 'next') {
      this.loadNextPage();
    }
  };

  Store.prototype.resumeAutoSync = function() {
    this.autoSyncSuspended = true;
  };

  Store.prototype.suspendAutoSync = function() {
    this.autoSyncSuspended = false;
  };

  Store.prototype.sync = function(options) {
    var needsSync, operations, toCreate, toDestroy, toUpdate;
    if (options == null) {
      options = {};
    }
    if (!this.proxy) {
      return;
    }
    toCreate = this.getNewRecords();
    toUpdate = this.getUpdatedRecords();
    toDestroy = this.getRemovedRecords();
    operations = {};
    needsSync = false;
    if (toCreate.length > 0) {
      operations.create = {
        records: toCreate,
        callback: this.createProxyCallback("onProxyCreateCallback", options)
      };
      needsSync = true;
    }
    if (toUpdate.length > 0) {
      operations.update = {
        records: toUpdate,
        callback: this.createProxyCallback("onProxyUpdateCallback", options)
      };
      needsSync = true;
    }
    if (toDestroy.length > 0) {
      operations.destroy = {
        records: toDestroy,
        callback: this.createProxyCallback("onProxyDestroyCallback", options)
      };
      needsSync = true;
    }
    if (needsSync) {
      operations.sync = true;
      this.emit("beforesync", operations);
      if (operations.sync) {
        this.proxy.execute(operations, {
          recordFactory: this.bound("createRecord")
        });
        this.emit("sync", this);
      }
    }
  };

  Store.prototype.createProxyCallback = function(name, options) {
    return (function(_this) {
      return function(op) {
        if (op.wasSuccessful()) {
          _this.emit("success", _this, op);
          _this[name]();
          if (options.success) {
            return options.success(_this, op);
          }
        } else {
          _this.emit("failure", _this, op);
          if (options.failure) {
            return options.failure(_this, op);
          }
        }
      };
    })(this);
  };

  Store.prototype.onProxyCreateCallback = function() {
    this.newRecords.empty();
    this.onProxyCallback();
    this.emit("created", this);
  };

  Store.prototype.onProxyUpdateCallback = function() {
    this.updatedRecords.empty();
    this.onProxyCallback();
    this.emit("updated", this);
  };

  Store.prototype.onProxyDestroyCallback = function() {
    this.removedRecords.empty();
    this.onProxyCallback();
    this.emit("destroyed", this);
  };

  Store.prototype.onProxyCallback = function() {
    this.emit("synced", this);
    if (this.autoSyncReload) {
      this.reload();
    }
  };

  Store.prototype.getSorters = function() {
    if (!this.storeSorters) {
      this.storeSorters = new StoreSorters(this);
    }
    return this.storeSorters;
  };

  Store.prototype.getFilters = function() {
    if (!this.storeFilters) {
      this.storeFilters = new StoreFilters(this);
    }
    return this.storeFilters;
  };

  Store.prototype.afterEdit = function(record, modifiedFieldNames) {
    var name, shouldSync, _i, _len;
    this.updatedRecords.include(record);
    if (this.proxy && this.autoSync && !this.autoSyncSuspended) {
      for (_i = 0, _len = modifiedFieldNames.length; _i < _len; _i++) {
        name = modifiedFieldNames[_i];
        if (record.fields[name].persist) {
          shouldSync = true;
          break;
        }
      }
      if (shouldSync) {
        this.sync();
      }
    }
    if (this.sortOnEdit && !this.remoteSort && this.storeSorters && this.storeSorters.has()) {
      this.storeSorters.apply(true);
    }
    if (this.filterOnEdit && !this.remoteFilter && this.storeFilters && this.storeFilters.has()) {
      this.storeFilters.apply(true);
    }
    this.emit("update", this, record, "edit", modifiedFieldNames);
  };

  Store.prototype.afterReject = function(record) {
    this.emit("update", this, record, "reject", null);
  };

  Store.prototype.afterCommit = function(record) {
    this.emit("update", this, record, "commit", null);
  };

  return Store;

})(Miwo.Object);

module.exports = Store;


},{"./StoreFilters":12,"./StoreSorters":14}],12:[function(require,module,exports){
var Filter, StoreFilters;

Filter = require('./Filter');

StoreFilters = (function() {
  StoreFilters.prototype.filters = null;

  StoreFilters.prototype.store = null;

  function StoreFilters(store) {
    this.store = store;
    this.filters = [];
  }

  StoreFilters.prototype.getAll = function() {
    return this.filters;
  };

  StoreFilters.prototype.clear = function() {
    this.filters.empty();
  };

  StoreFilters.prototype.append = function(filter) {
    this.filters.push(filter);
  };

  StoreFilters.prototype.has = function() {
    return this.filters.length > 0;
  };

  StoreFilters.prototype.add = function(name, value, type, operation, params) {
    var filter, _i, _len;
    if (Type.isArray(name)) {
      for (_i = 0, _len = name.length; _i < _len; _i++) {
        filter = name[_i];
        this.add(filter);
      }
    } else {
      if (Type.isInstance(name)) {
        this.append(name);
      } else if (Type.isObject(name)) {
        this.append(new Filter(name));
      } else {
        this.append(new Filter({
          name: name,
          value: value,
          type: type,
          operation: operation,
          params: params
        }));
      }
    }
    return this;
  };

  StoreFilters.prototype.filter = function(name, value, type, operation, params) {
    this.clear();
    if (name) {
      this.add(name, value, type, operation, params);
    }
    this.apply();
    return this;
  };

  StoreFilters.prototype.apply = function(silent) {
    var rec, _i, _len, _ref;
    if (this.store.remoteFilter) {
      this.store.load();
    } else {
      this.store.filtered = this.filters.length > 0;
      this.store.filteredData = [];
      _ref = this.store.data;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        rec = _ref[_i];
        if (this.match(rec)) {
          this.store.filteredData.push(rec);
        }
      }
      if (!silent) {
        this.store.emit("refresh", this.store);
      }
    }
    this.store.emit("filter", this.store, this.filters);
    return this;
  };

  StoreFilters.prototype.match = function(record) {
    var filter, _i, _len, _ref;
    _ref = this.filters;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      filter = _ref[_i];
      if (filter.match(record) === false) {
        return false;
      }
    }
    return true;
  };

  return StoreFilters;

})();

module.exports = StoreFilters;


},{"./Filter":5}],13:[function(require,module,exports){
var BaseManager, Store, StoreManager,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseManager = require('./BaseManager');

Store = require('./Store');

StoreManager = (function(_super) {
  __extends(StoreManager, _super);

  function StoreManager() {
    return StoreManager.__super__.constructor.apply(this, arguments);
  }

  StoreManager.prototype.create = function(name) {
    var store;
    store = StoreManager.__super__.create.call(this, name);
    if (!store.isStore) {
      throw new Error("Created store is not instance of Miwo.data.Store");
    }
    return store;
  };

  return StoreManager;

})(BaseManager);

module.exports = StoreManager;


},{"./BaseManager":1,"./Store":11}],14:[function(require,module,exports){
var Sorter, StoreSorters;

Sorter = require('./Sorter');

StoreSorters = (function() {
  StoreSorters.prototype.sorters = null;

  StoreSorters.prototype.store = null;

  function StoreSorters(store) {
    this.store = store;
    this.sorters = [];
  }

  StoreSorters.prototype.clear = function() {
    this.sorters.empty();
    return this;
  };

  StoreSorters.prototype.has = function() {
    return this.sorters.length > 0;
  };

  StoreSorters.prototype.set = function(name, dir) {
    var d, n;
    if (Type.isObject(name)) {
      for (n in name) {
        d = name[n];
        this.sorters.push(new Sorter({
          name: n,
          dir: d
        }));
      }
    } else {
      this.sorters.push(new Sorter({
        name: name,
        dir: dir
      }));
    }
    return this;
  };

  StoreSorters.prototype.sort = function(name, dir) {
    this.clear();
    if (name) {
      this.set(name, dir);
    }
    this.apply();
    return this;
  };

  StoreSorters.prototype.apply = function(silent) {
    var comparator;
    if (this.store.remoteSort) {
      this.store.load();
    } else {
      comparator = this.createSortComparator();
      this.store.sorted = this.sorters.length > 0;
      this.store.data.sort(comparator);
      if (this.store.filteredData) {
        this.store.filteredData.sort(comparator);
      }
      if (!silent) {
        this.store.emit("refresh", this.store);
      }
    }
    this.store.emit("sort", this.store, this.sorters);
    return this;
  };

  StoreSorters.prototype.createSortComparator = function() {
    return (function(_this) {
      return function(a, b) {
        var ret, sorter, _i, _len, _ref;
        if (!_this.sorters) {
          return;
        }
        _ref = _this.sorters;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          sorter = _ref[_i];
          ret = sorter.compare(a, b);
          if (ret === -1 || ret === 1) {
            return ret;
          }
        }
      };
    })(this);
  };

  StoreSorters.prototype.getInsertionIndex = function(record, compare) {
    var index, rec, _i, _len, _ref;
    index = 0;
    _ref = this.data;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      rec = _ref[index];
      if (compare(rec, record) > 0) {
        return index;
      }
    }
    return index;
  };

  StoreSorters.prototype.getIndex = function(rec) {
    return this.getInsertionIndex(rec, this.createSortComparator());
  };

  return StoreSorters;

})();

module.exports = StoreSorters;


},{"./Sorter":10}],15:[function(require,module,exports){
var Types;

Types = {
  stripRe: /[\$,%]/g,
  string: {
    type: "string",
    convert: function(v) {
      var defaultValue;
      defaultValue = (this.nullable ? null : "");
      return (v === undefined || v === null ? defaultValue : String(v));
    }
  },
  int: {
    type: "int",
    convert: function(v) {
      return (v !== undefined && v !== null && v !== "" ? parseInt(String(v).replace(Types.stripRe, ""), 10) : (this.nullable ? null : 0));
    }
  },
  float: {
    type: "float",
    convert: function(v) {
      return (v !== undefined && v !== null && v !== "" ? parseFloat(String(v).replace(Types.stripRe, ""), 10) : (this.nullable ? null : 0));
    }
  },
  boolean: {
    type: "boolean",
    convert: function(v) {
      if (this.nullable && (v === undefined || v === null || v === "")) {
        return null;
      }
      return v === true || v === "true" || v === 1;
    }
  },
  date: {
    type: "date",
    convert: function(v) {
      var parsed;
      parsed = void 0;
      if (!v) {
        return null;
      }
      if (Type.isDate(v)) {
        return v;
      }
      parsed = Date.parse(v);
      return (parsed ? new Date(parsed) : null);
    }
  },
  json: {
    type: "json",
    convert: function(v) {
      if (!v) {
        return {};
      } else if (Type.isString(v)) {
        return JSON.decode(v);
      } else {
        return v;
      }
    }
  },
  array: {
    type: "array",
    convert: function(v) {
      if (!v) {
        return null;
      } else if (Type.isArray(v)) {
        return v;
      } else if (Type.isString(v)) {
        return v.split(";");
      } else {
        return Array.from(v);
      }
    }
  }
};

module.exports = Types;


},{}],16:[function(require,module,exports){
Miwo.data = {
  Record: require('./Record'),
  Entity: require('./Entity'),
  Proxy: require('./Proxy'),
  Store: require('./Store'),
  Types: require('./Types'),
  Filter: require('./Filter'),
  Sorter: require('./Sorter')
};

Miwo.Store = Miwo.data.Store;

Miwo.Record = Miwo.data.Record;

Miwo.Entity = Miwo.data.Entity;

Miwo.Proxy = Miwo.data.Proxy;

miwo.registerExtension('miwo-data', require('./DiExtension'));


},{"./DiExtension":2,"./Entity":3,"./Filter":5,"./Proxy":7,"./Record":9,"./Sorter":10,"./Store":11,"./Types":15}]},{},[16])