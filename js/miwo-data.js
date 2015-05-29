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
var BaseManager, EntityManager,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseManager = require('./BaseManager');

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
    var Entity, GeneratedEntity, field, obj, _ref;
    Entity = require('./Entity');
    GeneratedEntity = (function(_super1) {
      __extends(GeneratedEntity, _super1);

      function GeneratedEntity() {
        return GeneratedEntity.__super__.constructor.apply(this, arguments);
      }

      GeneratedEntity.prototype.idProperty = config.idProperty;

      return GeneratedEntity;

    })(Entity);
    _ref = config.fields;
    for (field in _ref) {
      obj = _ref[field];
      GeneratedEntity.field(field, obj);
    }
    return GeneratedEntity;
  };

  return EntityManager;

})(BaseManager);

module.exports = EntityManager;


},{"./BaseManager":1,"./Entity":3}],5:[function(require,module,exports){
var Filter,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Filter = (function(_super) {
  __extends(Filter, _super);

  Filter.prototype.name = null;

  Filter.prototype.type = "string";

  Filter.prototype.operation = "=";

  Filter.prototype.value = null;

  Filter.prototype.params = null;

  function Filter(config) {
    Filter.__super__.constructor.call(this, config);
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

})(Miwo.Object);

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

  Operation.prototype.async = void 0;


  /**
  	  @cfg {String} action
  	  The action being performed by this Operation. Should be one of 'create', 'read', 'update' or 'destroy'.
   */

  Operation.prototype.action = void 0;


  /**
  	  @cfg {Miwo.data.Filter[]} filters
  	  Optional array of filter objects. Only applies to 'read' actions.
   */

  Operation.prototype.filters = void 0;


  /**
  	  @cfg {Miwo.data.Sorter[]} sorters
  	  Optional array of sorter objects. Only applies to 'read' actions.
   */

  Operation.prototype.sorters = void 0;


  /**
  	  @cfg {Number} start
  	  The start index (offset), used in paging when running a 'read' action.
   */

  Operation.prototype.offset = void 0;


  /**
  	  @cfg {Number} limit
  	  The number of records to load. Used on 'read' actions when paging is being used.
   */

  Operation.prototype.limit = void 0;


  /**
  	  @cfg {Object} params
  	  Parameters to pass along with the request when performing the operation.
   */

  Operation.prototype.params = void 0;


  /**
  	  @cfg {Function} callback
  	  Function to execute when operation completed.
  	  @cfg {Ext.data.Model[]} callback.records Array of records.
  	  @cfg {Ext.data.Operation} callback.operation The Operation itself.
  	  @cfg {Boolean} callback.success True when operation completed successfully.
   */

  Operation.prototype.callback = void 0;


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

  Operation.prototype.success = void 0;


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

  Operation.prototype.error = void 0;


  /**
  	  @property {String/Object} error
  	  Error code
  	  @private
   */

  Operation.prototype.code = void 0;


  /**
  	  @cfg {Miwo.data.Record[]} records
   */

  Operation.prototype.records = void 0;


  /**
  	  @property {Object} response
   */

  Operation.prototype.response = void 0;


  /**
  	  @cfg {function} recordFactory
   */

  Operation.prototype.createRecord = void 0;

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

  Proxy.prototype.execute = function(operations, options) {
    if (operations.destroy) {
      options.records = operations.destroy.records;
      this.destroy(options, operations.destroy.callback);
    }
    if (operations.create) {
      options.records = operations.create.records;
      this.create(options, operations.create.callback);
    }
    if (operations.update) {
      options.records = operations.update.records;
      this.update(options, operations.update.callback);
    }
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
    var op, record, records, _i, _len, _ref;
    records = [];
    if (config.records) {
      _ref = config.records;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        record = _ref[_i];
        records.push(record);
      }
    }
    config.records = records;
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
        _this.processResponse(true, operation, request, response, callback);
      };
    })(this);
    options.onFailure = (function(_this) {
      return function() {
        _this.processResponse(false, operation, request, null, callback);
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

  Proxy.prototype.processResponse = function(success, operation, request, response, callback) {
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
var Sorter,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Sorter = (function(_super) {
  __extends(Sorter, _super);

  function Sorter() {
    return Sorter.__super__.constructor.apply(this, arguments);
  }

  Sorter.prototype.name = null;

  Sorter.prototype.dir = null;

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

})(Miwo.Object);

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
    if (!this.proxy && this.api) {
      this.proxy = {
        api: this.api
      };
      delete this.api;
    }
    if (this.proxy || this.api) {
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
    return;
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
    this.emit("load", this, records);
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
    return this;
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
    return this;
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

  Store.prototype.load = function(options, done) {
    if (options == null) {
      options = {};
    }
    if (done == null) {
      done = null;
    }
    if (!this.proxy) {
      throw new Error("Cant load data, proxy is missing in store");
    }
    if (options.once && this.loaded) {
      miwo.async((function(_this) {
        return function() {
          if (done) {
            return done(_this, _this.data, true);
          }
        };
      })(this));
      return;
    }
    if (this.loading) {
      return;
    }
    options.params = Object.merge({}, this.params, options.params);
    options.offset = (options.offset !== undefined ? options.offset : (options.page ? options.page - 1 : 0) * this.pageSize);
    options.limit = options.limit || this.pageSize;
    options.filters = this.storeFilters ? this.storeFilters.getAll() : null;
    options.sorters = this.storeSorters ? this.storeSorters.getAll() : null;
    options.addRecords = options.addRecords || false;
    options.recordFactory = this.bound("createRecord");
    this.emit("beforeload", this, options);
    this.loading = true;
    this.page = (this.pageSize ? Math.max(1, Math.ceil(options.offset / this.pageSize) + 1) : 1);
    this.proxy.read(options, (function(_this) {
      return function(operation) {
        var records, response, successful;
        response = operation.getResponse();
        records = operation.getRecords();
        successful = operation.wasSuccessful();
        if (successful) {
          _this.loadRecords(records, true);
        }
        if (response) {
          _this.totalCount = response.total;
        }
        _this.loading = false;
        _this.loaded = true;
        _this.emit("load", _this, records, successful);
        if (done) {
          return done(_this, records, successful);
        }
      };
    })(this));
  };

  Store.prototype.reload = function(done) {
    this.load({
      page: this.page
    }, done);
  };

  Store.prototype.loadPage = function(page, done) {
    if (!this.pageSize) {
      return;
    }
    this.page = Math.max(1, Math.min(page, Math.ceil(this.totalCount / this.pageSize)));
    this.load({
      page: this.page
    }, done);
  };

  Store.prototype.loadPrevPage = function(done) {
    if (!this.pageSize) {
      return;
    }
    this.page = Math.max(1, this.page - 1);
    this.load({
      page: this.page
    }, done);
  };

  Store.prototype.loadNextPage = function(done) {
    if (!this.pageSize) {
      return;
    }
    this.page = Math.min(this.page + 1, Math.ceil(this.totalCount / this.pageSize));
    this.load({
      page: this.page
    }, done);
  };

  Store.prototype.loadNestedPage = function(type, done) {
    if (type === 'prev') {
      this.loadPrevPage(done);
    } else if (type === 'next') {
      this.loadNextPage(done);
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
      operations.preventSync = false;
      this.emit("beforesync", operations);
      if (!operations.preventSync) {
        this.proxy.execute(operations, {
          recordFactory: this.bound("createRecord")
        });
      }
    } else if (Type.isFunction(options)) {
      miwo.async((function(_this) {
        return function() {
          return options();
        };
      })(this));
    }
  };

  Store.prototype.createProxyCallback = function(name, options) {
    return (function(_this) {
      return function(op) {
        _this.emit("sync", _this, op);
        if (op.wasSuccessful()) {
          _this.emit("success", _this, op);
          _this[name]();
          if (Type.isObject(options)) {
            if (options.success) {
              return options.success(_this, op);
            }
          } else {
            return options(_this, op);
          }
        } else {
          _this.emit("failure", _this, op);
          if (Type.isObject(options)) {
            if (options.failure) {
              return options.failure(_this, op);
            }
          } else {
            return options(_this, op);
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
    this.updatedRecords.erase(record);
    this.emit("update", this, record, "reject", null);
  };

  Store.prototype.afterCommit = function(record) {
    this.updatedRecords.erase(record);
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
    return;
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
    if (!store.name) {
      store.name = name;
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
    this.comparator = this.createComparator(this);
    return;
  }

  StoreSorters.prototype.clear = function() {
    this.sorters.empty();
    return this;
  };

  StoreSorters.prototype.has = function() {
    return this.sorters.length > 0;
  };

  StoreSorters.prototype.getAll = function() {
    return this.sorters;
  };

  StoreSorters.prototype.set = function(name, dir) {
    var d, n;
    if (Type.isObject(name)) {
      for (n in name) {
        d = name[n];
        this.set(n, d);
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
    var comparator, sorters, store;
    store = this.store;
    sorters = this.sorters;
    comparator = this.comparator;
    if (store.remoteSort) {
      store.load();
    } else {
      store.sorted = sorters.length > 0;
      store.data.sort(comparator);
      if (store.filteredData) {
        store.filteredData.sort(comparator);
      }
      if (!silent) {
        store.emit("refresh", store);
      }
    }
    store.emit("sort", store, sorters);
    return this;
  };

  StoreSorters.prototype.getInsertionIndex = function(record, compare) {
    var index, rec, _i, _len, _ref;
    index = 0;
    _ref = this.store.data;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      rec = _ref[index];
      if (compare(rec, record) > 0) {
        return index;
      }
    }
    return index;
  };

  StoreSorters.prototype.getIndex = function(rec) {
    return this.getInsertionIndex(rec, this.comparator);
  };

  StoreSorters.prototype.createComparator = function(me) {
    return function(a, b) {
      var ret, sorter, _i, _len, _ref;
      if (!me.sorters) {
        return;
      }
      _ref = me.sorters;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        sorter = _ref[_i];
        ret = sorter.compare(a, b);
        if (ret === -1 || ret === 1) {
          return ret;
        }
      }
    };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi93d3cvdmhvc3RzL21pd29qcy9taXdvLWRhdGEvc3JjL0Jhc2VNYW5hZ2VyLmNvZmZlZSIsIi93d3cvdmhvc3RzL21pd29qcy9taXdvLWRhdGEvc3JjL0RpRXh0ZW5zaW9uLmNvZmZlZSIsIi93d3cvdmhvc3RzL21pd29qcy9taXdvLWRhdGEvc3JjL0VudGl0eS5jb2ZmZWUiLCIvd3d3L3Zob3N0cy9taXdvanMvbWl3by1kYXRhL3NyYy9FbnRpdHlNYW5hZ2VyLmNvZmZlZSIsIi93d3cvdmhvc3RzL21pd29qcy9taXdvLWRhdGEvc3JjL0ZpbHRlci5jb2ZmZWUiLCIvd3d3L3Zob3N0cy9taXdvanMvbWl3by1kYXRhL3NyYy9PcGVyYXRpb24uY29mZmVlIiwiL3d3dy92aG9zdHMvbWl3b2pzL21pd28tZGF0YS9zcmMvUHJveHkuY29mZmVlIiwiL3d3dy92aG9zdHMvbWl3b2pzL21pd28tZGF0YS9zcmMvUHJveHlNYW5hZ2VyLmNvZmZlZSIsIi93d3cvdmhvc3RzL21pd29qcy9taXdvLWRhdGEvc3JjL1JlY29yZC5jb2ZmZWUiLCIvd3d3L3Zob3N0cy9taXdvanMvbWl3by1kYXRhL3NyYy9Tb3J0ZXIuY29mZmVlIiwiL3d3dy92aG9zdHMvbWl3b2pzL21pd28tZGF0YS9zcmMvU3RvcmUuY29mZmVlIiwiL3d3dy92aG9zdHMvbWl3b2pzL21pd28tZGF0YS9zcmMvU3RvcmVGaWx0ZXJzLmNvZmZlZSIsIi93d3cvdmhvc3RzL21pd29qcy9taXdvLWRhdGEvc3JjL1N0b3JlTWFuYWdlci5jb2ZmZWUiLCIvd3d3L3Zob3N0cy9taXdvanMvbWl3by1kYXRhL3NyYy9TdG9yZVNvcnRlcnMuY29mZmVlIiwiL3d3dy92aG9zdHMvbWl3b2pzL21pd28tZGF0YS9zcmMvVHlwZXMuY29mZmVlIiwiL3d3dy92aG9zdHMvbWl3b2pzL21pd28tZGF0YS9zcmMvaW5kZXguY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSxXQUFBOztBQUFBO0FBRUMsd0JBQUEsS0FBQSxHQUFPLElBQVAsQ0FBQTs7QUFBQSx3QkFDQSxLQUFBLEdBQU8sSUFEUCxDQUFBOztBQUlhLEVBQUEscUJBQUEsR0FBQTtBQUNaLElBQUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxFQUFULENBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxLQUFELEdBQVMsRUFEVCxDQURZO0VBQUEsQ0FKYjs7QUFBQSx3QkFTQSxNQUFBLEdBQVEsU0FBQyxJQUFELEVBQU8sS0FBUCxHQUFBO0FBQ1AsSUFBQSxJQUFHLENBQUEsSUFBSyxDQUFDLFVBQUwsQ0FBZ0IsS0FBaEIsQ0FBSjtBQUNDLFlBQVUsSUFBQSxLQUFBLENBQU8sb0JBQUEsR0FBbUIsSUFBbkIsR0FBeUIsUUFBekIsR0FBZ0MsSUFBaEMsR0FBc0MsMEJBQTdDLENBQVYsQ0FERDtLQUFBO0FBQUEsSUFFQSxJQUFDLENBQUEsS0FBTSxDQUFBLElBQUEsQ0FBUCxHQUFlLEtBRmYsQ0FBQTtBQUdBLFdBQU8sSUFBUCxDQUpPO0VBQUEsQ0FUUixDQUFBOztBQUFBLHdCQWdCQSxRQUFBLEdBQVUsU0FBQyxJQUFELEVBQU8sTUFBUCxHQUFBO0FBQ1QsSUFBQSxJQUFDLENBQUEsS0FBTSxDQUFBLElBQUEsQ0FBUCxHQUFlLE1BQWYsQ0FBQTtBQUNBLFdBQU8sSUFBUCxDQUZTO0VBQUEsQ0FoQlYsQ0FBQTs7QUFBQSx3QkFxQkEsVUFBQSxHQUFZLFNBQUMsSUFBRCxHQUFBO0FBQ1gsSUFBQSxNQUFBLENBQUEsSUFBUSxDQUFBLEtBQU0sQ0FBQSxJQUFBLENBQWQsQ0FBQTtBQUNBLFdBQU8sSUFBUCxDQUZXO0VBQUEsQ0FyQlosQ0FBQTs7QUFBQSx3QkEwQkEsR0FBQSxHQUFLLFNBQUMsSUFBRCxHQUFBO0FBQ0osV0FBTyxJQUFDLENBQUEsS0FBTSxDQUFB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QUEsQ0FBUSxVQUFSLENBQVI7QUFBQSxFQUNBLE1BQUEsRUFBUSxPQUFBLENBQVEsVUFBUixDQURSO0FBQUEsRUFFQSxLQUFBLEVBQU8sT0FBQSxDQUFRLFNBQVIsQ0FGUDtBQUFBLEVBR0EsS0FBQSxFQUFPLE9BQUEsQ0FBUSxTQUFSLENBSFA7QUFBQSxFQUlBLEtBQUEsRUFBTyxPQUFBLENBQVEsU0FBUixDQUpQO0FBQUEsRUFLQSxNQUFBLEVBQVEsT0FBQSxDQUFRLFVBQVIsQ0FMUjtBQUFBLEVBTUEsTUFBQSxFQUFRLE9BQUEsQ0FBUSxVQUFSLENBTlI7Q0FERCxDQUFBOztBQUFBLElBVUksQ0FBQyxLQUFMLEdBQWEsSUFBSSxDQUFDLElBQUksQ0FBQyxLQVZ2QixDQUFBOztBQUFBLElBV0ksQ0FBQyxNQUFMLEdBQWMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQVh4QixDQUFBOztBQUFBLElBWUksQ0FBQyxNQUFMLEdBQWMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQVp4QixDQUFBOztBQUFBLElBYUksQ0FBQyxLQUFMLEdBQWEsSUFBSSxDQUFDLElBQUksQ0FBQyxLQWJ2QixDQUFBOztBQUFBLElBZ0JJLENBQUMsaUJBQUwsQ0FBdUIsV0FBdkIsRUFBb0MsT0FBQSxDQUFRLGVBQVIsQ0FBcEMsQ0FoQkEsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJjbGFzcyBCYXNlTWFuYWdlclxuXG5cdHR5cGVzOiBudWxsXG5cdGl0ZW1zOiBudWxsXG5cblxuXHRjb25zdHJ1Y3RvcjogLT5cblx0XHRAdHlwZXMgPSB7fVxuXHRcdEBpdGVtcyA9IHt9XG5cblxuXHRkZWZpbmU6IChuYW1lLCBrbGFzcykgLT5cblx0XHRpZiAhVHlwZS5pc0Z1bmN0aW9uKGtsYXNzKVxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiQmFkIGRlZmluZWQgdHlwZSAnI3tuYW1lfScgaW4gJyN7dGhpc30nLiBDbGFzcyBpcyBub3QgZnVuY3Rpb25cIilcblx0XHRAdHlwZXNbbmFtZV0gPSBrbGFzc1xuXHRcdHJldHVybiB0aGlzXG5cblxuXHRyZWdpc3RlcjogKG5hbWUsIG9iamVjdCkgLT5cblx0XHRAaXRlbXNbbmFtZV0gPSBvYmplY3Rcblx0XHRyZXR1cm4gdGhpc1xuXG5cblx0dW5yZWdpc3RlcjogKG5hbWUpIC0+XG5cdFx0ZGVsZXRlIEBpdGVtc1tuYW1lXVxuXHRcdHJldHVybiB0aGlzXG5cblxuXHRoYXM6IChuYW1lKSAtPlxuXHRcdHJldHVybiBAaXRlbXNbbmFtZV0gaXNudCB1bmRlZmluZWRcblxuXG5cdGdldDogKG5hbWUpIC0+XG5cdFx0aWYgIUBpdGVtc1tuYW1lXVxuXHRcdFx0QHJlZ2lzdGVyKG5hbWUsIEBjcmVhdGUobmFtZSkpXG5cdFx0cmV0dXJuIEBpdGVtc1tuYW1lXVxuXG5cblx0Y3JlYXRlOiAobmFtZSwgY29uZmlnKSAtPlxuXHRcdGlmICFAdHlwZXNbbmFtZV1cblx0XHRcdHRocm93IG5ldyBFcnJvcihcIlVuZGVmaW5lZCB0eXBlICcje25hbWV9JyBpbiAje3RoaXN9XCIpXG5cdFx0cmV0dXJuIG5ldyBAdHlwZXNbbmFtZV0oY29uZmlnKVxuXG5cblx0dG9TdHJpbmc6IC0+XG5cdFx0cmV0dXJuIEBjb25zdHJ1Y3Rvci5uYW1lXG5cblxubW9kdWxlLmV4cG9ydHMgPSBCYXNlTWFuYWdlciIsIlN0b3JlTWFuYWdlciA9IHJlcXVpcmUgJy4vU3RvcmVNYW5hZ2VyJ1xuUHJveHlNYW5hZ2VyID0gcmVxdWlyZSAnLi9Qcm94eU1hbmFnZXInXG5FbnRpdHlNYW5hZ2VyID0gcmVxdWlyZSAnLi9FbnRpdHlNYW5hZ2VyJ1xuXG5cbmNsYXNzIERhdGFFeHRlbnNpb24gZXh0ZW5kcyBNaXdvLmRpLkluamVjdG9yRXh0ZW5zaW9uXG5cblxuXHRpbml0OiAtPlxuXHRcdEBzZXRDb25maWdcblx0XHRcdHN0b3Jlczoge31cblx0XHRcdGVudGl0aWVzOiB7fVxuXHRcdHJldHVyblxuXG5cblx0YnVpbGQ6IChpbmplY3RvcikgLT5cblx0XHRuYW1lc3BhY2UgPSB3aW5kb3dbaW5qZWN0b3IucGFyYW1zLm5hbWVzcGFjZV1cblx0XHRuYW1lc3BhY2UuZW50aXR5ID0ge30gIGlmICFuYW1lc3BhY2UuZW50aXR5XG5cdFx0bmFtZXNwYWNlLnN0b3JlID0ge30gIGlmICFuYW1lc3BhY2Uuc3RvcmVcblxuXHRcdGluamVjdG9yLmRlZmluZSAnc3RvcmVNZ3InLCBTdG9yZU1hbmFnZXIsIChzZXJ2aWNlKT0+XG5cdFx0XHRmb3IgbmFtZSwgc3RvcmUgb2YgQGNvbmZpZy5zdG9yZXNcblx0XHRcdFx0c2VydmljZS5kZWZpbmUobmFtZSwgc3RvcmUpXG5cdFx0XHRcdG5hbWVzcGFjZS5zdG9yZVtuYW1lLmNhcGl0YWxpemUoKV0gPSBzdG9yZVxuXHRcdFx0cmV0dXJuXG5cblx0XHRpbmplY3Rvci5kZWZpbmUgJ2VudGl0eU1ncicsIEVudGl0eU1hbmFnZXIsIChzZXJ2aWNlKT0+XG5cdFx0XHRmb3IgbmFtZSwgZW50aXR5IG9mIEBjb25maWcuZW50aXRpZXNcblx0XHRcdFx0c2VydmljZS5kZWZpbmUobmFtZSwgZW50aXR5KVxuXHRcdFx0XHRuYW1lc3BhY2UuZW50aXR5W25hbWUuY2FwaXRhbGl6ZSgpXSA9IGVudGl0eVxuXHRcdFx0cmV0dXJuXG5cblx0XHRpbmplY3Rvci5kZWZpbmUgJ3Byb3h5TWdyJywgUHJveHlNYW5hZ2VyLCAoc2VydmljZSk9PlxuXHRcdFx0IyBzZXR1cCBwcm94aWVzIGZyb20gZW50aXRpZXNcblx0XHRcdGZvciBuYW1lLCBlbnRpdHkgb2YgQGNvbmZpZy5lbnRpdGllc1xuXHRcdFx0XHRpZiBlbnRpdHkucHJveHlcblx0XHRcdFx0XHRzZXJ2aWNlLmRlZmluZShuYW1lLCBlbnRpdHkucHJveHkpXG5cdFx0XHRcdFx0ZW50aXR5LnByb3h5ID0gbmFtZVxuXHRcdFx0cmV0dXJuXG5cdFx0cmV0dXJuXG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IERhdGFFeHRlbnNpb24iLCJSZWNvcmQgPSByZXF1aXJlICcuL1JlY29yZCdcblN0b3JlID0gcmVxdWlyZSAnLi9TdG9yZSdcbkVudGl0eU1hbmFnZXIgPSByZXF1aXJlICcuL0VudGl0eU1hbmFnZXInXG5cblxuY2xhc3MgRW50aXR5IGV4dGVuZHMgUmVjb3JkXG5cblx0Y29sbGVjdGlvbnM6IG51bGxcblx0ZW50aXRpZXM6IG51bGxcblxuXG5cdEBjb2xsZWN0aW9uOiAobmFtZSwgY29uZmlnKSAtPlxuXHRcdGlmIEBwcm90b3R5cGVbbmFtZV1cblx0XHRcdHRocm93IG5ldyBFcnJvcihcIlByb3BlcnR5ICN7bmFtZX0gaXMgYWxyZWFkeSBkZWZpbmVkLiBQbGVhc2UgdXNlIG90aGVyIGNvbGxlY3Rpb24gbmFtZVwiKVxuXG5cdFx0IyBzZXQgY29sbGVjdGlvbiBtZXRhZGF0YVxuXHRcdGlmICFAcHJvdG90eXBlLl9jb2xsZWN0aW9uc1xuXHRcdFx0QHByb3RvdHlwZS5fY29sbGVjdGlvbnMgPSB7fVxuXHRcdEBwcm90b3R5cGUuX2NvbGxlY3Rpb25zW25hbWVdID0gY29uZmlnXG5cdFx0IyBjcmVhdGUgcmVsYXRlZCBwcm9wZXJ0eSBnZXR0ZXJcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkgQHByb3RvdHlwZSwgbmFtZSxcblx0XHRcdFx0XHRcdFx0ICBnZXQ6IC0+IHJldHVybiBAZ2V0Q29sbGVjdGlvbihuYW1lKVxuXG5cdFx0b3duZXJOYW1lID0gQHByb3RvdHlwZS5jb25zdHJ1Y3Rvci5uYW1lXG5cdFx0cmVsYXRlZFByb3RvdHlwZSA9IGNvbmZpZy50eXBlLnByb3RvdHlwZVxuXHRcdCMgc2V0IGVudGl0aWVzIG1ldGFkYXRhXG5cdFx0aWYgIXJlbGF0ZWRQcm90b3R5cGUuX2VudGl0aWVzXG5cdFx0XHRyZWxhdGVkUHJvdG90eXBlLl9lbnRpdGllcyA9IHt9XG5cdFx0cmVsYXRlZFByb3RvdHlwZS5fZW50aXRpZXNbb3duZXJOYW1lXSA9IHt0eXBlOiBAcHJvdG90eXBlLmNvbnN0cnVjdG9yfVxuXHRcdCMgY3JlYXRlIHJldmVyc2UgZW50aXR5IGdldHRlclxuXHRcdHJlbGF0ZWRQcm90b3R5cGVbJ2dldCcrb3duZXJOYW1lLmNhcGl0YWxpemUoKV0gPSAoY2FsbGJhY2spLT5cblx0XHRcdEBnZXRFbnRpdHkob3duZXJOYW1lLCBjYWxsYmFjaylcblx0XHRcdHJldHVyblxuXHRcdHJldHVyblxuXG5cblx0c2V0dXA6IChkYXRhKSAtPlxuXHRcdHN1cGVyKGRhdGEpXG5cdFx0aWYgQF9jb2xsZWN0aW9uc1xuXHRcdFx0IyBjb25maWd1cmUgY29sbGVjdGlvbnNcblx0XHRcdEBjb2xsZWN0aW9ucyA9IHt9XG5cdFx0XHRmb3IgbmFtZSxjb25maWcgb2YgQF9jb2xsZWN0aW9uc1xuXHRcdFx0XHRAY29sbGVjdGlvbnNbbmFtZV0gPSBuZXcgU3RvcmVcblx0XHRcdFx0XHRlbnRpdHk6IGNvbmZpZy50eXBlXG5cblx0XHRcdCMgbG9hZCBjb2xsZWN0aW9ucyBkYXRhXG5cdFx0XHRmb3IgbmFtZSwgY29sbGVjdGlvbiBvZiBAY29sbGVjdGlvbnNcblx0XHRcdFx0dmFsdWVzID0gZGF0YVtuYW1lXSB8fCBbXVxuXHRcdFx0XHRjb2xsZWN0aW9uLmxvYWREYXRhKHZhbHVlcylcblx0XHRyZXR1cm5cblxuXG5cdGNvcHk6IChzb3VyY2UpIC0+XG5cdFx0c3VwZXIoc291cmNlKVxuXHRcdCMgdG9kbzogY29weSBjb2xsZWN0aW9ucyArIGVudGl0aXRlcyA/P1xuXHRcdHJldHVyblxuXG5cblx0Z2V0Q29sbGVjdGlvbjogKG5hbWUpIC0+XG5cdFx0cmV0dXJuIEBjb2xsZWN0aW9uc1tuYW1lXVxuXG5cblx0Z2V0RW50aXR5OiAobmFtZSwgY2FsbGJhY2spIC0+XG5cdFx0aWYgIUBlbnRpdGllc1xuXHRcdFx0QGVudGl0aWVzID0ge31cblx0XHRpZiAhQGVudGl0aWVzW25hbWVdXG5cdFx0XHRAZW50aXRpZXNbbmFtZV0gPSBuZXcgQF9lbnRpdGllc1tuYW1lXS50eXBlKClcblx0XHRAZW50aXRpZXNbbmFtZV0ubG9hZChAZ2V0KG5hbWUrJ0lkJyksIGNhbGxiYWNrKVxuXHRcdHJldHVyblxuXG5cblx0c2F2ZTogKGNhbGxiYWNrKSAtPlxuXHRcdEVudGl0eU1hbmFnZXIuc2F2ZSh0aGlzLCBjYWxsYmFjaylcblx0XHRyZXR1cm5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IEVudGl0eSIsIkJhc2VNYW5hZ2VyID0gcmVxdWlyZSAnLi9CYXNlTWFuYWdlcidcblxuXG5jbGFzcyBFbnRpdHlNYW5hZ2VyIGV4dGVuZHMgQmFzZU1hbmFnZXJcblxuXHRwcm94eUtsYXNzOiBudWxsXG5cblxuXHRzZXRQcm94eTogKEBwcm94eUtsYXNzKSAtPlxuXHRcdHJldHVybiB0aGlzXG5cblxuXHRnZXQ6IChuYW1lKSAtPlxuXHRcdHJldHVybiBAaXRlbXNbbmFtZV1cblxuXG5cdGxvYWQ6IChlbnRpdHksIGlkLCBjYWxsYmFjaykgLT5cblxuXHRcdHJldHVyblxuXG5cblx0c2F2ZTogKGVudGl0eSwgY2FsbGJhY2spIC0+XG5cblx0XHRyZXR1cm5cblxuXG5cdGNyZWF0ZTogKG5hbWUsIGNvbmZpZykgLT5cblx0XHRpZiBUeXBlLmlzU3RyaW5nKG5hbWUpXG5cdFx0XHRlbnRpdHkgPSBzdXBlcihuYW1lLCBjb25maWcpXG5cdFx0ZWxzZSBpZiBUeXBlLmlzRnVuY3Rpb24obmFtZSlcblx0XHRcdGVudGl0eSA9IG5ldyBuYW1lKGNvbmZpZylcblx0XHRlbHNlXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJDYW50IGNyZWF0ZSBlbnRpdHksIHBhcmFtZXRlciBuYW1lIG11c3QgYnkgc3RyaW5nIG9yIGZ1bmN0aW9uLCB5b3UgcHV0OiBcIisgKHR5cGVvZiBuYW1lKSlcblxuXHRcdCMgaW5pdCBlbnRpdHkgcHJveHlcblxuXHRcdHJldHVybiBlbnRpdHlcblxuXG5cdGNyZWF0ZUVudGl0eUNsYXNzOiAoY29uZmlnKSAtPlxuXHRcdEVudGl0eSA9IHJlcXVpcmUgJy4vRW50aXR5J1xuXG5cdFx0Y2xhc3MgR2VuZXJhdGVkRW50aXR5IGV4dGVuZHMgRW50aXR5XG5cdFx0XHRpZFByb3BlcnR5OiBjb25maWcuaWRQcm9wZXJ0eVxuXG5cdFx0Zm9yIGZpZWxkLG9iaiBvZiBjb25maWcuZmllbGRzXG5cdFx0XHRHZW5lcmF0ZWRFbnRpdHkuZmllbGQoZmllbGQsIG9iailcblxuXHRcdHJldHVybiBHZW5lcmF0ZWRFbnRpdHlcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEVudGl0eU1hbmFnZXIiLCJjbGFzcyBGaWx0ZXIgZXh0ZW5kcyBNaXdvLk9iamVjdFxuXG5cdG5hbWU6IG51bGxcblx0dHlwZTogXCJzdHJpbmdcIlxuXHRvcGVyYXRpb246IFwiPVwiXG5cdHZhbHVlOiBudWxsXG5cdHBhcmFtczogbnVsbFxuXG5cblx0Y29uc3RydWN0b3I6IChjb25maWcpIC0+XG5cdFx0c3VwZXIoY29uZmlnKVxuXHRcdGlmIEBvcGVyYXRpb24gaXMgXCJpblwiIG9yIEBvcGVyYXRpb24gaXMgXCIhaW5cIlxuXHRcdFx0QHZhbHVlID0gQHZhbHVlLnNwbGl0KFwiLFwiKVxuXHRcdHJldHVyblxuXG5cblx0bWF0Y2g6IChyZWNvcmQpIC0+XG5cdFx0aWYgQHR5cGUgaXMgXCJjYWxsYmFja1wiXG5cdFx0XHRyZXR1cm4gQG9wZXJhdGlvbihyZWNvcmQsIEB2YWx1ZSlcblx0XHRlbHNlIGlmIEB0eXBlIGlzIFwic3RyaW5nXCJcblx0XHRcdHZhbCA9IHJlY29yZC5nZXQoQG5hbWUpXG5cdFx0XHRzd2l0Y2ggQG9wZXJhdGlvblxuXHRcdFx0XHR3aGVuIFwiPVwiXG5cdFx0XHRcdFx0cmV0dXJuIHZhbCBpcyBAdmFsdWVcblx0XHRcdFx0d2hlbiBcIiE9XCJcblx0XHRcdFx0XHRyZXR1cm4gdmFsIGlzbnQgQHZhbHVlXG5cdFx0XHRcdHdoZW4gXCJpblwiXG5cdFx0XHRcdFx0cmV0dXJuIEB2YWx1ZS5pbmRleE9mKHZhbCkgPj0gMFxuXHRcdFx0XHR3aGVuIFwiIWluXCJcblx0XHRcdFx0XHRyZXR1cm4gQHZhbHVlLmluZGV4T2YodmFsKSA8IDBcblx0XHRcdFx0d2hlbiBcIiFlbXB0eVwiXG5cdFx0XHRcdFx0cmV0dXJuICEhdmFsXG5cdFx0XHRcdHdoZW4gXCJlbXB0eVwiXG5cdFx0XHRcdFx0cmV0dXJuICF2YWxcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdHJldHVybiBudWxsXG5cblxuXHR0b0RhdGE6IC0+XG5cdFx0bmFtZTogQG5hbWVcblx0XHR2YWx1ZTogQHZhbHVlXG5cdFx0dHlwZTogQHR5cGVcblx0XHRvcGVyYXRpb246IEBvcGVyYXRpb25cblx0XHRwYXJhbXM6IEpTT04uZW5jb2RlKEBwYXJhbXMpXG5cblxubW9kdWxlLmV4cG9ydHMgPSBGaWx0ZXIiLCJSZWNvcmQgPSByZXF1aXJlICcuL1JlY29yZCdcblxuXG5jbGFzcyBPcGVyYXRpb24gZXh0ZW5kcyBNaXdvLk9iamVjdFxuXG5cdCMjIypcblx0ICBAY2ZnIHtTdHJpbmd9IGFzeW5jXG5cdCAgRXhlY3V0ZSB0aGlzIG9wZXJhdGlvbiBhc3luY2hyb25vdXNseS4gRGVmYXVsdHMgYnkgcHJveHkgc2V0dGluZ3Ncblx0ICAjIyNcblx0YXN5bmM6IHVuZGVmaW5lZFxuXG5cdCMjIypcblx0ICBAY2ZnIHtTdHJpbmd9IGFjdGlvblxuXHQgIFRoZSBhY3Rpb24gYmVpbmcgcGVyZm9ybWVkIGJ5IHRoaXMgT3BlcmF0aW9uLiBTaG91bGQgYmUgb25lIG9mICdjcmVhdGUnLCAncmVhZCcsICd1cGRhdGUnIG9yICdkZXN0cm95Jy5cblx0ICAjIyNcblx0YWN0aW9uOiB1bmRlZmluZWRcblxuXHQjIyMqXG5cdCAgQGNmZyB7TWl3by5kYXRhLkZpbHRlcltdfSBmaWx0ZXJzXG5cdCAgT3B0aW9uYWwgYXJyYXkgb2YgZmlsdGVyIG9iamVjdHMuIE9ubHkgYXBwbGllcyB0byAncmVhZCcgYWN0aW9ucy5cblx0ICAjIyNcblx0ZmlsdGVyczogdW5kZWZpbmVkXG5cblx0IyMjKlxuXHQgIEBjZmcge01pd28uZGF0YS5Tb3J0ZXJbXX0gc29ydGVyc1xuXHQgIE9wdGlvbmFsIGFycmF5IG9mIHNvcnRlciBvYmplY3RzLiBPbmx5IGFwcGxpZXMgdG8gJ3JlYWQnIGFjdGlvbnMuXG5cdCAgIyMjXG5cdHNvcnRlcnM6IHVuZGVmaW5lZFxuXG5cdCMjIypcblx0ICBAY2ZnIHtOdW1iZXJ9IHN0YXJ0XG5cdCAgVGhlIHN0YXJ0IGluZGV4IChvZmZzZXQpLCB1c2VkIGluIHBhZ2luZyB3aGVuIHJ1bm5pbmcgYSAncmVhZCcgYWN0aW9uLlxuXHQgICMjI1xuXHRvZmZzZXQ6IHVuZGVmaW5lZFxuXG5cdCMjIypcblx0ICBAY2ZnIHtOdW1iZXJ9IGxpbWl0XG5cdCAgVGhlIG51bWJlciBvZiByZWNvcmRzIHRvIGxvYWQuIFVzZWQgb24gJ3JlYWQnIGFjdGlvbnMgd2hlbiBwYWdpbmcgaXMgYmVpbmcgdXNlZC5cblx0ICAjIyNcblx0bGltaXQ6IHVuZGVmaW5lZFxuXG5cdCMjIypcblx0ICBAY2ZnIHtPYmplY3R9IHBhcmFtc1xuXHQgIFBhcmFtZXRlcnMgdG8gcGFzcyBhbG9uZyB3aXRoIHRoZSByZXF1ZXN0IHdoZW4gcGVyZm9ybWluZyB0aGUgb3BlcmF0aW9uLlxuXHQgICMjI1xuXHRwYXJhbXM6IHVuZGVmaW5lZFxuXG5cdCMjIypcblx0ICBAY2ZnIHtGdW5jdGlvbn0gY2FsbGJhY2tcblx0ICBGdW5jdGlvbiB0byBleGVjdXRlIHdoZW4gb3BlcmF0aW9uIGNvbXBsZXRlZC5cblx0ICBAY2ZnIHtFeHQuZGF0YS5Nb2RlbFtdfSBjYWxsYmFjay5yZWNvcmRzIEFycmF5IG9mIHJlY29yZHMuXG5cdCAgQGNmZyB7RXh0LmRhdGEuT3BlcmF0aW9ufSBjYWxsYmFjay5vcGVyYXRpb24gVGhlIE9wZXJhdGlvbiBpdHNlbGYuXG5cdCAgQGNmZyB7Qm9vbGVhbn0gY2FsbGJhY2suc3VjY2VzcyBUcnVlIHdoZW4gb3BlcmF0aW9uIGNvbXBsZXRlZCBzdWNjZXNzZnVsbHkuXG5cdCAgIyMjXG5cdGNhbGxiYWNrOiB1bmRlZmluZWRcblxuXHQjIyMqXG5cdCAgQHByb3BlcnR5IHtCb29sZWFufSBzdGFydGVkXG5cdCAgVGhlIHN0YXJ0IHN0YXR1cyBvZiB0aGlzIE9wZXJhdGlvbi4gVXNlIHtAbGluayAjaXNTdGFydGVkfS5cblx0ICBAcmVhZG9ubHlcblx0ICBAcHJpdmF0ZVxuXHQgICMjI1xuXHRzdGFydGVkOiBmYWxzZVxuXG5cdCMjIypcblx0ICBAcHJvcGVydHkge0Jvb2xlYW59IHJ1bm5pbmdcblx0ICBUaGUgcnVuIHN0YXR1cyBvZiB0aGlzIE9wZXJhdGlvbi4gVXNlIHtAbGluayAjaXNSdW5uaW5nfS5cblx0ICBAcmVhZG9ubHlcblx0ICBAcHJpdmF0ZVxuXHQgICMjI1xuXHRydW5uaW5nOiBmYWxzZVxuXG5cdCMjIypcblx0ICBAcHJvcGVydHkge0Jvb2xlYW59IGNvbXBsZXRlXG5cdCAgVGhlIGNvbXBsZXRpb24gc3RhdHVzIG9mIHRoaXMgT3BlcmF0aW9uLiBVc2Uge0BsaW5rICNpc0NvbXBsZXRlfS5cblx0ICBAcmVhZG9ubHlcblx0ICBAcHJpdmF0ZVxuXHQgICMjI1xuXHRjb21wbGV0ZTogZmFsc2VcblxuXHQjIyMqXG5cdCAgQHByb3BlcnR5IHtCb29sZWFufSBzdWNjZXNzXG5cdCAgV2hldGhlciB0aGUgT3BlcmF0aW9uIHdhcyBzdWNjZXNzZnVsIG9yIG5vdC4gVGhpcyBzdGFydHMgYXMgdW5kZWZpbmVkIGFuZCBpcyBzZXQgdG8gdHJ1ZVxuXHQgIG9yIGZhbHNlIGJ5IHRoZSBQcm94eSB0aGF0IGlzIGV4ZWN1dGluZyB0aGUgT3BlcmF0aW9uLiBJdCBpcyBhbHNvIHNldCB0byBmYWxzZSBieSB7QGxpbmsgI3NldEV4Y2VwdGlvbn0uIFVzZVxuXHQgIHtAbGluayAjd2FzU3VjY2Vzc2Z1bH0gdG8gcXVlcnkgc3VjY2VzcyBzdGF0dXMuXG5cdCAgQHJlYWRvbmx5XG5cdCAgQHByaXZhdGVcblx0ICAjIyNcblx0c3VjY2VzczogdW5kZWZpbmVkXG5cblx0IyMjKlxuXHQgIEBwcm9wZXJ0eSB7Qm9vbGVhbn0gZXhjZXB0aW9uXG5cdCAgVGhlIGV4Y2VwdGlvbiBzdGF0dXMgb2YgdGhpcyBPcGVyYXRpb24uIFVzZSB7QGxpbmsgI2hhc0V4Y2VwdGlvbn0gYW5kIHNlZSB7QGxpbmsgI2dldEVycm9yfS5cblx0ICBAcmVhZG9ubHlcblx0ICBAcHJpdmF0ZVxuXHQgICMjI1xuXHRleGNlcHRpb246IGZhbHNlXG5cblx0IyMjKlxuXHQgIEBwcm9wZXJ0eSB7U3RyaW5nL09iamVjdH0gZXJyb3Jcblx0ICBUaGUgZXJyb3Igb2JqZWN0IHBhc3NlZCB3aGVuIHtAbGluayAjc2V0RXhjZXB0aW9ufSB3YXMgY2FsbGVkLiBUaGlzIGNvdWxkIGJlIGFueSBvYmplY3Qgb3IgcHJpbWl0aXZlLlxuXHQgIEBwcml2YXRlXG5cdCAgIyMjXG5cdGVycm9yOiB1bmRlZmluZWRcblxuXHQjIyMqXG5cdCAgQHByb3BlcnR5IHtTdHJpbmcvT2JqZWN0fSBlcnJvclxuXHQgIEVycm9yIGNvZGVcblx0ICBAcHJpdmF0ZVxuXHQgICMjI1xuXHRjb2RlOiB1bmRlZmluZWRcblxuXHQjIyMqXG5cdCAgQGNmZyB7TWl3by5kYXRhLlJlY29yZFtdfSByZWNvcmRzXG5cdCAgIyMjXG5cdHJlY29yZHM6IHVuZGVmaW5lZFxuXG5cdCMjIypcblx0ICBAcHJvcGVydHkge09iamVjdH0gcmVzcG9uc2Vcblx0ICAjIyNcblx0cmVzcG9uc2U6IHVuZGVmaW5lZFxuXG5cdCMjIypcblx0ICBAY2ZnIHtmdW5jdGlvbn0gcmVjb3JkRmFjdG9yeVxuXHQgICMjI1xuXHRjcmVhdGVSZWNvcmQ6IHVuZGVmaW5lZFxuXG5cblx0Y29uc3RydWN0b3I6IChjb25maWcpIC0+XG5cdFx0c3VwZXIoY29uZmlnKVxuXHRcdGlmIGNvbmZpZy5yZWNvcmRGYWN0b3J5XG5cdFx0XHRAY3JlYXRlUmVjb3JkID0gY29uZmlnLnJlY29yZEZhY3Rvcnlcblx0XHRlbHNlXG5cdFx0XHRAY3JlYXRlUmVjb3JkID0gKHZhbHVlcykgLT4gbmV3IFJlY29yZCh2YWx1ZXMpXG5cdFx0cmV0dXJuXG5cblxuXHQjIyMqXG5cdCAgU2V0IHJlY29yZHMgZmFjb3RyeSBjYWxsYmFja1xuXHQgIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG5cdCAgIyMjXG5cdHNldFJlY29yZEZhY3Rvcnk6IChjYWxsYmFjaykgLT5cblx0XHRAY3JlYXRlUmVjb3JkID0gY2FsbGJhY2tcblx0XHRyZXR1cm5cblxuXG5cdCMjIypcblx0ICBSZXR1cm5zIHJlc3BvbnNlIGZyb20gc2VydmVyIChKU09OIG9iamVjdClcblx0ICBAcmV0dXJuIHtPYmplY3R9XG5cdCAgIyMjXG5cdGdldFJlc3BvbnNlOiAtPlxuXHRcdHJldHVybiBAcmVzcG9uc2VcblxuXG5cdCMjIypcblx0ICBSZXR1cm5zIG9wZXJhdGlvbnMgcmVjb3Jkc1xuXHQgIEByZXR1cm4ge01pd28uZGF0YS5SZWNvcmRbXX1cblx0ICAjIyNcblx0Z2V0UmVjb3JkczogLT5cblx0XHRyZXR1cm4gQHJlY29yZHNcblxuXG5cdCMjIypcblx0ICBSZXR1cm5zIGZpcnN0IHJlY29yZCBpbiByZWNvcmQgc2V0XG5cdCAgQHJldHVybiB7TWl3by5kYXRhLlJlY29yZH1cblx0ICAjIyNcblx0Z2V0UmVjb3JkOiAtPlxuXHRcdHJldHVybiAoaWYgQHJlY29yZHMgYW5kIEByZWNvcmRzLmxlbmd0aCA+IDAgdGhlbiBAcmVjb3Jkc1swXSBlbHNlIG51bGwpXG5cblxuXHQjIyMqXG5cdCAgTWFya3MgdGhlIE9wZXJhdGlvbiBhcyBjb21wbGV0ZWQuXG5cdCAgIyMjXG5cdHNldENvbXBsZXRlZDogLT5cblx0XHRAY29tcGxldGUgPSB0cnVlXG5cdFx0QHJ1bm5pbmcgPSBmYWxzZVxuXHRcdHJldHVyblxuXG5cblx0IyMjKlxuXHQgIE1hcmtzIHRoZSBPcGVyYXRpb24gYXMgc3VjY2Vzc2Z1bC5cblx0ICAjIyNcblx0c2V0U3VjY2Vzc2Z1bDogLT5cblx0XHRAc3VjY2VzcyA9IHRydWVcblx0XHRyZXR1cm5cblxuXG5cdCMjIypcblx0ICBNYXJrcyB0aGUgT3BlcmF0aW9uIGFzIGhhdmluZyBleHBlcmllbmNlZCBhbiBleGNlcHRpb24uIENhbiBiZSBzdXBwbGllZCB3aXRoIGFuIG9wdGlvbiBlcnJvciBtZXNzYWdlL29iamVjdC5cblx0ICBAcGFyYW0ge1N0cmluZy9PYmplY3R9IGVycm9yIChvcHRpb25hbCkgZXJyb3Igc3RyaW5nL29iamVjdFxuXHQgICMjI1xuXHRzZXRFeGNlcHRpb246IChlcnJvciwgY29kZSkgLT5cblx0XHRAZXhjZXB0aW9uID0gdHJ1ZVxuXHRcdEBzdWNjZXNzID0gZmFsc2Vcblx0XHRAcnVubmluZyA9IGZhbHNlXG5cdFx0QGVycm9yID0gZXJyb3Jcblx0XHRAY29kZSA9IGNvZGVcblx0XHRyZXR1cm5cblxuXG5cdCMjIypcblx0ICBSZXR1cm5zIHRydWUgaWYgdGhpcyBPcGVyYXRpb24gZW5jb3VudGVyZWQgYW4gZXhjZXB0aW9uIChzZWUgYWxzbyB7QGxpbmsgI2dldEVycm9yfSlcblx0ICBAcmV0dXJuIHtCb29sZWFufSBUcnVlIGlmIHRoZXJlIHdhcyBhbiBleGNlcHRpb25cblx0ICAjIyNcblx0aGFzRXhjZXB0aW9uOiAtPlxuXHRcdHJldHVybiBAZXhjZXB0aW9uIGlzIHRydWVcblxuXG5cdCMjIypcblx0ICBSZXR1cm5zIHRoZSBlcnJvciBzdHJpbmcgb3Igb2JqZWN0IHRoYXQgd2FzIHNldCB1c2luZyB7QGxpbmsgI3NldEV4Y2VwdGlvbn1cblx0ICBAcmV0dXJuIHtTdHJpbmcvT2JqZWN0fSBUaGUgZXJyb3Igb2JqZWN0XG5cdCAgIyMjXG5cdGdldEVycm9yOiAtPlxuXHRcdHJldHVybiBAZXJyb3JcblxuXG5cdCMjIypcblx0ICBSZXR1cm5zIGNvZGVcblx0ICBAcmV0dXJuIHtTdHJpbmcvT2JqZWN0fSBUaGUgcmVzcG9uc2UgY29kZVxuXHQgICMjI1xuXHRnZXRDb2RlOiAtPlxuXHRcdHJldHVybiBAY29kZVxuXG5cblx0IyMjKlxuXHQgIFJldHVybnMgdHJ1ZSBpZiB0aGUgT3BlcmF0aW9uIGhhcyBiZWVuIHN0YXJ0ZWQuIE5vdGUgdGhhdCB0aGUgT3BlcmF0aW9uIG1heSBoYXZlIHN0YXJ0ZWQgQU5EIGNvbXBsZXRlZCwgc2VlXG5cdCAge0BsaW5rICNpc1J1bm5pbmd9IHRvIHRlc3QgaWYgdGhlIE9wZXJhdGlvbiBpcyBjdXJyZW50bHkgcnVubmluZy5cblx0ICBAcmV0dXJuIHtCb29sZWFufSBUcnVlIGlmIHRoZSBPcGVyYXRpb24gaGFzIHN0YXJ0ZWRcblx0ICAjIyNcblx0aXNTdGFydGVkOiAtPlxuXHRcdHJldHVybiBAc3RhcnRlZCBpcyB0cnVlXG5cblxuXHQjIyMqXG5cdCAgUmV0dXJucyB0cnVlIGlmIHRoZSBPcGVyYXRpb24gaGFzIGJlZW4gc3RhcnRlZCBidXQgaGFzIG5vdCB5ZXQgY29tcGxldGVkLlxuXHQgIEByZXR1cm4ge0Jvb2xlYW59IFRydWUgaWYgdGhlIE9wZXJhdGlvbiBpcyBjdXJyZW50bHkgcnVubmluZ1xuXHQgICMjI1xuXHRpc1J1bm5pbmc6IC0+XG5cdFx0cmV0dXJuIEBydW5uaW5nIGlzIHRydWVcblxuXG5cdCMjIypcblx0ICBSZXR1cm5zIHRydWUgaWYgdGhlIE9wZXJhdGlvbiBoYXMgYmVlbiBjb21wbGV0ZWRcblx0ICBAcmV0dXJuIHtCb29sZWFufSBUcnVlIGlmIHRoZSBPcGVyYXRpb24gaXMgY29tcGxldGVcblx0ICAjIyNcblx0aXNDb21wbGV0ZTogLT5cblx0XHRyZXR1cm4gQGNvbXBsZXRlIGlzIHRydWVcblxuXG5cdCMjIypcblx0ICBSZXR1cm5zIHRydWUgaWYgdGhlIE9wZXJhdGlvbiBoYXMgY29tcGxldGVkIGFuZCB3YXMgc3VjY2Vzc2Z1bFxuXHQgIEByZXR1cm4ge0Jvb2xlYW59IFRydWUgaWYgc3VjY2Vzc2Z1bFxuXHQgICMjI1xuXHR3YXNTdWNjZXNzZnVsOiAtPlxuXHRcdHJldHVybiBAaXNDb21wbGV0ZSgpIGFuZCBAc3VjY2VzcyBpcyB0cnVlXG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IE9wZXJhdGlvbiIsIk9wZXJhdGlvbiA9IHJlcXVpcmUgJy4vT3BlcmF0aW9uJ1xuXG5cbmNsYXNzIFByb3h5IGV4dGVuZHMgTWl3by5PYmplY3RcblxuXHRpc1Byb3h5OiB0cnVlXG5cdG5hbWU6IHVuZGVmaW5lZFxuXHRoZWFkZXJzOiBudWxsXG5cdHNlY3VyZTogdHJ1ZVxuXHRkZWZhdWx0czogbnVsbFxuXHRhcGk6IG51bGxcblxuXG5cdGNvbnN0cnVjdG9yOiAoY29uZmlnKSAtPlxuXHRcdEBkZWZhdWx0cyA9XG5cdFx0XHR0aW1lb3V0OiAwXG5cdFx0XHRhc3luYzogdHJ1ZVxuXHRcdEBhcGkgPVxuXHRcdFx0Y3JlYXRlOiB1bmRlZmluZWRcblx0XHRcdHJlYWQ6IHVuZGVmaW5lZFxuXHRcdFx0dXBkYXRlOiB1bmRlZmluZWRcblx0XHRcdGRlc3Ryb3k6IHVuZGVmaW5lZFxuXG5cdFx0aWYgY29uZmlnLnVybFxuXHRcdFx0QGFwaS5yZWFkID0gQHVybFxuXHRcdFx0ZGVsZXRlIGNvbmZpZy51cmxcblxuXHRcdHN1cGVyKGNvbmZpZylcblx0XHRyZXR1cm5cblxuXG5cdHNldEFzeW5jOiAoYXN5bmMpIC0+XG5cdFx0QGRlZmF1bHRzLmFzeW5jID0gYXN5bmNcblx0XHRyZXR1cm5cblxuXG5cdGV4ZWN1dGU6IChvcGVyYXRpb25zLCBvcHRpb25zKSAtPlxuXHRcdGlmIG9wZXJhdGlvbnMuZGVzdHJveVxuXHRcdFx0b3B0aW9ucy5yZWNvcmRzID0gb3BlcmF0aW9ucy5kZXN0cm95LnJlY29yZHNcblx0XHRcdEBkZXN0cm95KG9wdGlvbnMsIG9wZXJhdGlvbnMuZGVzdHJveS5jYWxsYmFjaylcblxuXHRcdGlmIG9wZXJhdGlvbnMuY3JlYXRlXG5cdFx0XHRvcHRpb25zLnJlY29yZHMgPSBvcGVyYXRpb25zLmNyZWF0ZS5yZWNvcmRzXG5cdFx0XHRAY3JlYXRlKG9wdGlvbnMsIG9wZXJhdGlvbnMuY3JlYXRlLmNhbGxiYWNrKVxuXG5cdFx0aWYgb3BlcmF0aW9ucy51cGRhdGVcblx0XHRcdG9wdGlvbnMucmVjb3JkcyA9IG9wZXJhdGlvbnMudXBkYXRlLnJlY29yZHNcblx0XHRcdEB1cGRhdGUob3B0aW9ucywgb3BlcmF0aW9ucy51cGRhdGUuY2FsbGJhY2spXG5cdFx0cmV0dXJuXG5cblxuXHRyZWFkOiAoY29uZmlnLCBjYWxsYmFjaykgLT5cblx0XHRAZG9SZXF1ZXN0KEBjcmVhdGVPcGVyYXRpb24oJ3JlYWQnLCBjb25maWcpLCBjYWxsYmFjaylcblx0XHRyZXR1cm5cblxuXG5cdGNyZWF0ZTogKGNvbmZpZywgY2FsbGJhY2spIC0+XG5cdFx0QGRvUmVxdWVzdChAY3JlYXRlT3BlcmF0aW9uKCdjcmVhdGUnLCBjb25maWcpLCBjYWxsYmFjaylcblx0XHRyZXR1cm5cblxuXG5cdHVwZGF0ZTogKGNvbmZpZywgY2FsbGJhY2spIC0+XG5cdFx0QGRvUmVxdWVzdChAY3JlYXRlT3BlcmF0aW9uKCd1cGRhdGUnLCBjb25maWcpLCBjYWxsYmFjaylcblx0XHRyZXR1cm5cblxuXG5cdGRlc3Ryb3k6IChjb25maWcsIGNhbGxiYWNrKSAtPlxuXHRcdEBkb1JlcXVlc3QoQGNyZWF0ZU9wZXJhdGlvbignZGVzdHJveScsIGNvbmZpZyksIGNhbGxiYWNrKVxuXHRcdHJldHVyblxuXG5cblx0Y3JlYXRlT3BlcmF0aW9uOiAoYWN0aW9uLCBjb25maWcpIC0+XG5cdFx0cmVjb3JkcyA9IFtdXG5cdFx0aWYgY29uZmlnLnJlY29yZHNcblx0XHRcdGZvciByZWNvcmQgaW4gY29uZmlnLnJlY29yZHNcblx0XHRcdFx0cmVjb3Jkcy5wdXNoKHJlY29yZClcblx0XHRjb25maWcucmVjb3JkcyA9IHJlY29yZHNcblxuXHRcdG9wID0gbmV3IE9wZXJhdGlvbihjb25maWcpXG5cdFx0b3AuYWN0aW9uID0gYWN0aW9uXG5cdFx0cmV0dXJuIG9wXG5cblxuXHQjIEBwYXJhbSB7TWl3by5kYXRhLk9wZXJhdGlvbn0gb3BlcmF0aW9uXG5cdCMgQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2tcblx0ZG9SZXF1ZXN0OiAob3BlcmF0aW9uLCBjYWxsYmFjaykgLT5cblx0XHRyZXF1ZXN0ID0gbWl3by5odHRwLmNyZWF0ZVJlcXVlc3QoKVxuXG5cdFx0b3B0aW9ucyA9IE9iamVjdC5tZXJnZSh7fSwgQGRlZmF1bHRzKVxuXHRcdG9wdGlvbnMubWV0aG9kID0gXCJQT1NUXCJcblx0XHRvcHRpb25zLmhlYWRlcnMgPSBAaGVhZGVyc1xuXHRcdG9wdGlvbnMudXJsID0gQGFwaVtvcGVyYXRpb24uYWN0aW9uXVxuXHRcdG9wdGlvbnMuZGF0YSA9IEBjcmVhdGVSZXF1ZXN0RGF0YShvcGVyYXRpb24pXG5cdFx0b3B0aW9ucy5vbkNvbXBsZXRlID0gLT5cblx0XHRcdG9wZXJhdGlvbi5zZXRDb21wbGV0ZWQoKVxuXHRcdFx0cmV0dXJuXG5cdFx0b3B0aW9ucy5vblJlcXVlc3QgPSAtPlxuXHRcdFx0b3BlcmF0aW9uLnJ1bm5pbmcgPSB0cnVlXG5cdFx0XHRyZXR1cm5cblx0XHRvcHRpb25zLm9uU3VjY2VzcyA9IChyZXNwb25zZSkgPT5cblx0XHRcdEBwcm9jZXNzUmVzcG9uc2UodHJ1ZSwgb3BlcmF0aW9uLCByZXF1ZXN0LCByZXNwb25zZSwgY2FsbGJhY2spXG5cdFx0XHRyZXR1cm5cblx0XHRvcHRpb25zLm9uRmFpbHVyZSA9ID0+XG5cdFx0XHRAcHJvY2Vzc1Jlc3BvbnNlKGZhbHNlLCBvcGVyYXRpb24sIHJlcXVlc3QsIG51bGwsIGNhbGxiYWNrKVxuXHRcdFx0cmV0dXJuXG5cdFx0aWYgb3BlcmF0aW9uLmFzeW5jIGlzbnQgdW5kZWZpbmVkXG5cdFx0XHRvcHRpb25zLmFzeW5jID0gb3BlcmF0aW9uLmFzeW5jXG5cblx0XHRvcGVyYXRpb24uc3RhcnRlZCA9IHRydWVcblx0XHRyZXF1ZXN0LnNldE9wdGlvbnMob3B0aW9ucylcblx0XHRyZXF1ZXN0LnNlbmQoKVxuXHRcdHJldHVyblxuXG5cblx0Y3JlYXRlUmVxdWVzdERhdGE6IChvcGVyYXRpb24pIC0+XG5cdFx0ZGF0YSA9IHt9XG5cdFx0ZGF0YS5hY3Rpb24gPSBvcGVyYXRpb24uYWN0aW9uXG5cdFx0c3dpdGNoIG9wZXJhdGlvbi5hY3Rpb25cblx0XHRcdHdoZW4gXCJjcmVhdGVcIlxuXHRcdFx0XHRkYXRhLmRhdGEgPSBAY3JlYXRlT3BlcmF0aW9uRGF0YShvcGVyYXRpb24sICdjcmVhdGUnKVxuXHRcdFx0d2hlbiBcImRlc3Ryb3lcIlxuXHRcdFx0XHRkYXRhLmRhdGEgPSBAY3JlYXRlT3BlcmF0aW9uRGF0YShvcGVyYXRpb24sICdkZXN0cm95Jylcblx0XHRcdHdoZW4gXCJ1cGRhdGVcIlxuXHRcdFx0XHRkYXRhLmRhdGEgPSBAY3JlYXRlT3BlcmF0aW9uRGF0YShvcGVyYXRpb24sICd1cGRhdGUnKVxuXHRcdFx0d2hlbiBcInJlYWRcIlxuXHRcdFx0XHRkYXRhLmZpbHRlcnMgPSBAY3JlYXRlSXRlbXNEYXRhKG9wZXJhdGlvbi5maWx0ZXJzKSAgaWYgb3BlcmF0aW9uLmZpbHRlcnNcblx0XHRcdFx0ZGF0YS5zb3J0ZXJzID0gQGNyZWF0ZUl0ZW1zRGF0YShvcGVyYXRpb24uc29ydGVycykgIGlmIG9wZXJhdGlvbi5zb3J0ZXJzXG5cdFx0XHRcdGRhdGEub2Zmc2V0ID0gb3BlcmF0aW9uLm9mZnNldCAgaWYgb3BlcmF0aW9uLm9mZnNldFxuXHRcdFx0XHRkYXRhLmxpbWl0ID0gb3BlcmF0aW9uLmxpbWl0ICBpZiBvcGVyYXRpb24ubGltaXRcblx0XHRcdFx0T2JqZWN0LmV4cGFuZChkYXRhLCBvcGVyYXRpb24ucGFyYW1zKSAgaWYgb3BlcmF0aW9uLnBhcmFtc1xuXHRcdHJldHVybiBkYXRhXG5cblxuXHRjcmVhdGVJdGVtc0RhdGE6IChpdGVtcykgLT5cblx0XHRkYXRhID0gW11cblx0XHRmb3IgaXRlbSBpbiBpdGVtc1xuXHRcdFx0ZGF0YS5wdXNoKGl0ZW0udG9EYXRhKCkpXG5cdFx0cmV0dXJuIGRhdGFcblxuXG5cdGNyZWF0ZU9wZXJhdGlvbkRhdGE6IChvcGVyYXRpb24sIG1vZGUpIC0+XG5cdFx0aWYgIW9wZXJhdGlvbi5nZXRSZWNvcmRzKClcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIm9wZXJhdGlvbiBoYXMgbm8gcmVjb3Jkc1wiKVxuXG5cdFx0ZGF0YSA9IFtdXG5cdFx0Zm9yIHJlY29yZCBpbiBvcGVyYXRpb24uZ2V0UmVjb3JkcygpXG5cdFx0XHRpZiBtb2RlIGlzICdjcmVhdGUnXG5cdFx0XHRcdGRhdGEucHVzaChyZWNvcmQuZ2V0VmFsdWVzKCkpXG5cdFx0XHRlbHNlIGlmIG1vZGUgaXMgJ3VwZGF0ZSdcblx0XHRcdFx0Y2hhbmdlcyA9IHJlY29yZC5nZXRDaGFuZ2VzKClcblx0XHRcdFx0Y2hhbmdlc1tyZWNvcmQuaWRQcm9wZXJ0eV0gPSByZWNvcmQuZ2V0SWQoKVxuXHRcdFx0XHRkYXRhLnB1c2goY2hhbmdlcylcblx0XHRcdGVsc2UgaWYgbW9kZSBpcyAnZGVzdHJveSdcblx0XHRcdFx0ZGF0YS5wdXNoKHJlY29yZC5nZXRJZCgpKVxuXG5cdFx0cmV0dXJuIEpTT04uZW5jb2RlKGRhdGEpXG5cblxuXHRwcm9jZXNzUmVzcG9uc2U6IChzdWNjZXNzLCBvcGVyYXRpb24sIHJlcXVlc3QsIHJlc3BvbnNlLCBjYWxsYmFjaykgLT5cblx0XHRpZiAhc3VjY2Vzc1xuXHRcdFx0eGhyID0gcmVxdWVzdC54aHJcblx0XHRcdG9wZXJhdGlvbi5zZXRFeGNlcHRpb24oeGhyLnJlc3BvbnNlVGV4dCwgeGhyLnN0YXR1cylcblx0XHRlbHNlXG5cdFx0XHRpZiAhcmVzcG9uc2Uuc3VjY2Vzc1xuXHRcdFx0XHRvcGVyYXRpb24uc2V0RXhjZXB0aW9uKHJlc3BvbnNlLmVycm9yLCByZXNwb25zZS5jb2RlKVxuXHRcdFx0ZWxzZVxuXHRcdFx0XHRvcGVyYXRpb24uc2V0U3VjY2Vzc2Z1bCgpXG5cdFx0XHRcdG9wZXJhdGlvbi5yZXNwb25zZSA9IHJlc3BvbnNlXG5cdFx0XHRcdEBjb21taXRPcGVyYXRpb24ob3BlcmF0aW9uLCByZXNwb25zZS5yZWNvcmRzKVxuXHRcdGNhbGxiYWNrKG9wZXJhdGlvbilcblx0XHRyZXR1cm5cblxuXG5cdGNvbW1pdE9wZXJhdGlvbjogKG9wZXJhdGlvbiwgcmVjb3JkcykgLT5cblx0XHRzd2l0Y2ggb3BlcmF0aW9uLmFjdGlvblxuXHRcdFx0d2hlbiBcImNyZWF0ZVwiXG5cdFx0XHRcdGZvciBkYXRhLGluZGV4IGluIHJlY29yZHNcblx0XHRcdFx0XHRyZWNvcmQgPSBvcGVyYXRpb24ucmVjb3Jkc1tpbmRleF1cblx0XHRcdFx0XHRyZWNvcmQuc2V0KGRhdGEpXG5cdFx0XHRcdFx0cmVjb3JkLmNvbW1pdCgpXG5cblx0XHRcdHdoZW4gXCJ1cGRhdGVcIlxuXHRcdFx0XHRmb3IgZGF0YSBpbiByZWNvcmRzXG5cdFx0XHRcdFx0Zm9yIHJlY29yZCBpbiBvcGVyYXRpb24ucmVjb3Jkc1xuXHRcdFx0XHRcdFx0aWYgcmVjb3JkLmdldElkKCkgaXMgZGF0YS5pZFxuXHRcdFx0XHRcdFx0XHRyZWNvcmQuc2V0KGRhdGEpXG5cdFx0XHRcdFx0XHRcdHJlY29yZC5jb21taXQoKVxuXHRcdFx0XHRcdFx0XHRicmVha1xuXG5cdFx0XHR3aGVuIFwicmVhZFwiXG5cdFx0XHRcdG9wZXJhdGlvbi5yZWNvcmRzID0gW11cblx0XHRcdFx0Zm9yIGRhdGEgaW4gcmVjb3Jkc1xuXHRcdFx0XHRcdHJlY29yZCA9IG9wZXJhdGlvbi5jcmVhdGVSZWNvcmQoZGF0YSlcblx0XHRcdFx0XHRvcGVyYXRpb24ucmVjb3Jkcy5wdXNoKHJlY29yZClcblx0XHRyZXR1cm5cblxuXG5cbm1vZHVsZS5leHBvcnRzID0gUHJveHkiLCJCYXNlTWFuYWdlciA9IHJlcXVpcmUgJy4vQmFzZU1hbmFnZXInXG5Qcm94eSA9IHJlcXVpcmUgJy4vUHJveHknXG5cbmNsYXNzIFByb3h5TWFuYWdlciBleHRlbmRzIEJhc2VNYW5hZ2VyXG5cblxuXHRkZWZpbmU6IChuYW1lLCBrbGFzcykgLT5cblx0XHRpZiAhVHlwZS5pc0Z1bmN0aW9uKGtsYXNzKSAmJiAhVHlwZS5pc09iamVjdChrbGFzcylcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIkJhZCBkZWZpbmVkIHR5cGUgJyN7bmFtZX0nIGluICcje3RoaXN9Jy4gUGFyYW1ldGVyIHNob3VsZCBieSBmdW5jdGlvbiBvciBvYmplY3RcIilcblx0XHRAdHlwZXNbbmFtZV0gPSBrbGFzc1xuXHRcdHJldHVybiB0aGlzXG5cblxuXHRjcmVhdGU6IChuYW1lKSAtPlxuXHRcdGlmICFAdHlwZXNbbmFtZV1cblx0XHRcdHRocm93IG5ldyBFcnJvcihcIlVuZGVmaW5lZCB0eXBlICcje25hbWV9JyBpbiAje3RoaXN9XCIpXG5cdFx0cmV0dXJuIEBjcmVhdGVQcm94eShAdHlwZXNbbmFtZV0pXG5cblxuXHRjcmVhdGVQcm94eTogKGNvbmZpZykgLT5cblx0XHRpZiBUeXBlLmlzRnVuY3Rpb24oY29uZmlnKVxuXHRcdFx0cHJveHkgPSBuZXcgY29uZmlnKClcblx0XHRpZiBUeXBlLmlzT2JqZWN0KGNvbmZpZylcblx0XHRcdHByb3h5ID0gbmV3IFByb3h5KGNvbmZpZylcblx0XHRpZiAhcHJveHkuaXNQcm94eVxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiQ3JlYXRlZCBwcm94eSBpcyBub3QgaW5zdGFuY2Ugb2YgTWl3by5kYXRhLlByb3h5XCIpXG5cdFx0cmV0dXJuIHByb3h5XG5cblxubW9kdWxlLmV4cG9ydHMgPSBQcm94eU1hbmFnZXIiLCJUeXBlcyA9IHJlcXVpcmUgJy4vVHlwZXMnXG5cblxuY2xhc3MgUmVjb3JkIGV4dGVuZHMgTWl3by5FdmVudHNcblxuXHRpc1JlY29yZDogdHJ1ZVxuXHRpZFByb3BlcnR5OiBcImlkXCJcblx0X3BoYW50b206IGZhbHNlXG5cdF9lZGl0aW5nOiBmYWxzZVxuXHRfZGlydHk6IGZhbHNlXG5cdF9kYXRhOiBudWxsXG5cdF9tb2RpZmllZDogbnVsbFxuXHRfc3RvcmVzOiBudWxsXG5cdF9zdG9yZTogbnVsbFxuXHRfcmF3OiBudWxsXG5cdGZpZWxkczogbnVsbFxuXG5cdCMgVGhpcyBvYmplY3QgaXMgdXNlZCB3aGVuZXZlciB0aGUgc2V0KCkgbWV0aG9kIGlzIGNhbGxlZCBhbmQgZ2l2ZW4gYSBzdHJpbmcgYXMgdGhlXG5cdCMgZmlyc3QgYXJndW1lbnQuIFRoaXMgYXBwcm9hY2ggc2F2ZXMgbWVtb3J5IChhbmQgR0MgY29zdHMpIHNpbmNlIHdlIGNvdWxkIGJlIGNhbGxlZFxuXHQjIGEgbG90LlxuXHRfc2luZ2xlUHJvcDoge31cblxuXHRAZ2V0dGVyICdwaGFudG9tJywgLT4gQF9waGFudG9tXG5cblxuXHRAZmllbGQ6IChuYW1lLCBjb25maWcpIC0+XG5cdFx0aWYgQHByb3RvdHlwZVtuYW1lXVxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiUHJvcGVydHkgI3tuYW1lfSBpcyBhbHJlYWR5IHVzZWQuIFBsZWFzZSB1c2Ugb3RoZXIgZmllbGQgbmFtZVwiKVxuXG5cdFx0aWYgIUBwcm90b3R5cGUuX2ZpZWxkc1xuXHRcdFx0QHByb3RvdHlwZS5fZmllbGRzID0ge31cblx0XHRAcHJvdG90eXBlLl9maWVsZHNbbmFtZV0gPSBjb25maWdcblxuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSBAcHJvdG90eXBlLCBuYW1lLFxuXHRcdFx0Z2V0OiAtPiByZXR1cm4gQGdldChuYW1lKVxuXHRcdFx0c2V0OiAodmFsdWUpIC0+IEBzZXQobmFtZSwgdmFsdWUpXG5cdFx0cmV0dXJuXG5cblxuXHRjb25zdHJ1Y3RvcjogKGRhdGEgPSB7fSwgc291cmNlID0gbnVsbCkgLT5cblx0XHRAX2RhdGEgPSB7fVxuXHRcdEBfc3RvcmVzID0gW11cblx0XHRAX3JhdyA9IGRhdGFcblx0XHRAZmllbGRzID0ge31cblxuXHRcdGlmICFzb3VyY2Vcblx0XHRcdEBzZXR1cChkYXRhKVxuXHRcdGVsc2Vcblx0XHRcdEBjb3B5KHNvdXJjZSlcblxuXHRcdCMgaW5pdGlhbGl6ZVxuXHRcdEBfbW9kaWZpZWQgPSB7fVxuXHRcdEBfZGlydHkgPSBmYWxzZVxuXHRcdEBfcGhhbnRvbSA9ICEoQGdldElkKCkgb3IgQGdldElkKCkgaXMgMClcblx0XHRAaW5pdCgpXG5cdFx0cmV0dXJuXG5cblxuXHRpbml0OiAoKSAtPlxuXHRcdHJldHVyblxuXG5cblx0c2V0dXA6IChkYXRhKSAtPlxuXHRcdCMgY29uZmlndXJlIGZpZWxkc1xuXHRcdGZvciBuYW1lLGZpZWxkIG9mIEBfZmllbGRzXG5cdFx0XHR0eXBlID0gZmllbGQudHlwZSBvciBcInN0cmluZ1wiXG5cdFx0XHRpZiAhVHlwZXNbdHlwZV1cblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiUmVjb3JkOjppbml0aWFsaXplKCk6IHVuZGVmaW5lZCB0eXBlIFwiICsgdHlwZSlcblx0XHRcdEBmaWVsZHNbbmFtZV0gPSBPYmplY3QubWVyZ2Uge30sIFR5cGVzW3R5cGVdLFxuXHRcdFx0XHRuYW1lOiBuYW1lXG5cdFx0XHRcdGRlZjogKGlmIGZpZWxkLmRlZiBpc250IHVuZGVmaW5lZCB0aGVuIGZpZWxkLmRlZiBlbHNlIG51bGwpXG5cdFx0XHRcdG51bGxhYmxlOiAoaWYgZmllbGQubnVsbGFibGUgaXNudCB1bmRlZmluZWQgdGhlbiBmaWVsZC5udWxsYWJsZSBlbHNlIG51bGwpXG5cdFx0XHRcdHBlcnNpc3Q6IChpZiBmaWVsZC5wZXJzaXN0IGlzbnQgdW5kZWZpbmVkIHRoZW4gZmllbGQucGVyc2lzdCBlbHNlIHRydWUpXG5cblx0XHQjIGxvYWQgZmllbGRzIGRhdGFcblx0XHRmb3IgbmFtZSxmaWVsZCBvZiBAZmllbGRzXG5cdFx0XHR2YWx1ZSA9IGRhdGFbbmFtZV1cblx0XHRcdHZhbHVlID0gZmllbGQuZGVmICBpZiB2YWx1ZSBpcyB1bmRlZmluZWRcblx0XHRcdHZhbHVlID0gZmllbGQuY29udmVydCh2YWx1ZSwgdGhpcykgIGlmIGZpZWxkLmNvbnZlcnRcblx0XHRcdCMgT24gaW5zdGFuY2UgY29uc3RydWN0aW9uLCBkbyBub3QgY3JlYXRlIGRhdGEgcHJvcGVydGllcyBiYXNlZCBvbiB1bmRlZmluZWQgaW5wdXQgcHJvcGVydGllc1xuXHRcdFx0aWYgdmFsdWUgaXNudCB1bmRlZmluZWRcblx0XHRcdFx0QF9kYXRhW25hbWVdID0gdmFsdWVcblx0XHRcdFx0QG9uVmFsdWVDaGFuZ2VkKG5hbWUsIHZhbHVlLCBudWxsKVxuXHRcdHJldHVyblxuXG5cblx0Y29weTogKHNvdXJjZSkgLT5cblx0XHRAZmllbGRzID0gc291cmNlLmZpZWxkc1xuXHRcdEBfZGF0YSA9IHNvdXJjZS5kYXRhXG5cdFx0cmV0dXJuXG5cblxuXHQjIyMqXG5cdCAgQ3JlYXRlcyBhIGNvcHkgKGNsb25lKSBvZiB0aGlzIFJlY29yZCBpbnN0YW5jZS5cblx0ICBAcmV0dXJuIHtNaXdvLmRhdGEuUmVjb3JkfVxuXHQgICMjI1xuXHRjbG9uZTogKG5ld0lkKSAtPlxuXHRcdHNvdXJjZSA9IE9iamVjdC5tZXJnZSh7fSwge2ZpZWxkczogQGZpZWxkcywgZGF0YTogQF9kYXRhfSlcblx0XHRzb3VyY2UuZGF0YVtAaWRQcm9wZXJ0eV0gPSBuZXdJZFxuXHRcdG5ldyBAY29uc3RydWN0b3IoQF9yYXcsIHNvdXJjZSkgIyB0b2RvIHRlc3RcblxuXG5cdCMjIypcblx0ICBHZXQgdmFsdWUgZnJvbSByZWNvcmRcblx0ICBAcGFyYW0gbmFtZVxuXHQgIEByZXR1cm5zIHttaXhlZH1cblx0ICAjIyNcblx0Z2V0OiAobmFtZSkgLT5cblx0XHRnZXR0ZXIgPSBcImdldFwiICsgbmFtZS5jYXBpdGFsaXplKClcblx0XHRyZXR1cm4gaWYgdGhpc1tnZXR0ZXJdIHRoZW4gdGhpc1tnZXR0ZXJdKCkgZWxzZSBAX2RhdGFbbmFtZV1cblxuXG5cdCMjIypcblx0ICBTZXRzIHRoZSBnaXZlbiBmaWVsZCB0byB0aGUgZ2l2ZW4gdmFsdWUsIG1hcmtzIHRoZSBpbnN0YW5jZSBhcyBkaXJ0eVxuXHQgIEBwYXJhbSB7U3RyaW5nL09iamVjdH0gZmllbGROYW1lIFRoZSBmaWVsZCB0byBzZXQsIG9yIGFuIG9iamVjdCBjb250YWluaW5nIGtleS92YWx1ZSBwYWlyc1xuXHQgIEBwYXJhbSB7T2JqZWN0fSBuZXdWYWx1ZSBUaGUgdmFsdWUgdG8gc2V0XG5cdCAgQHJldHVybiB7U3RyaW5nW119IFRoZSBhcnJheSBvZiBtb2RpZmllZCBmaWVsZCBuYW1lcyBvciBudWxsIGlmIG5vdGhpbmcgd2FzIG1vZGlmaWVkLlxuXHQgICMjI1xuXHRzZXQ6IChmaWVsZE5hbWUsIG5ld1ZhbHVlKSAtPlxuXHRcdHNpbmdsZSA9IFR5cGUuaXNTdHJpbmcoZmllbGROYW1lKVxuXG5cdFx0aWYgc2luZ2xlXG5cdFx0XHR2YWx1ZXMgPSBAX3NpbmdsZVByb3Bcblx0XHRcdHZhbHVlc1tmaWVsZE5hbWVdID0gbmV3VmFsdWVcblx0XHRlbHNlXG5cdFx0XHR2YWx1ZXMgPSBmaWVsZE5hbWVcblxuXHRcdGZvciBuYW1lLHZhbHVlIG9mIHZhbHVlc1xuXHRcdFx0aWYgIUBmaWVsZHNbbmFtZV1cblx0XHRcdFx0Y29udGludWVcblxuXHRcdFx0ZmllbGQgPSBAZmllbGRzW25hbWVdXG5cdFx0XHR2YWx1ZSA9IGZpZWxkLmNvbnZlcnQodmFsdWUsIHRoaXMpICBpZiBmaWVsZC5jb252ZXJ0XG5cdFx0XHRjdXJyZW50VmFsdWUgPSBAX2RhdGFbbmFtZV1cblxuXHRcdFx0aWYgQGlzRXF1YWwoY3VycmVudFZhbHVlLCB2YWx1ZSkgIyBuZXcgdmFsdWUgaXMgdGhlIHNhbWUsIHNvIG5vIGNoYW5nZS4uLlxuXHRcdFx0XHRjb250aW51ZVxuXG5cdFx0XHRAX2RhdGFbbmFtZV0gPSB2YWx1ZVxuXHRcdFx0QG9uVmFsdWVDaGFuZ2VkKG5hbWUsIHZhbHVlLCBjdXJyZW50VmFsdWUpXG5cdFx0XHQobW9kaWZpZWRGaWVsZE5hbWVzIG9yIChtb2RpZmllZEZpZWxkTmFtZXMgPSBbXSkpLnB1c2gobmFtZSlcblxuXHRcdFx0aWYgZmllbGQucGVyc2lzdFxuXHRcdFx0XHRpZiBAX21vZGlmaWVkW25hbWVdXG5cdFx0XHRcdFx0aWYgQGlzRXF1YWwoQF9tb2RpZmllZFtuYW1lXSwgdmFsdWUpXG5cdFx0XHRcdFx0XHQjIFRoZSBvcmlnaW5hbCB2YWx1ZSBpbiBtZS5tb2RpZmllZCBlcXVhbHMgdGhlIG5ldyB2YWx1ZSwgc29cblx0XHRcdFx0XHRcdCMgdGhlIGZpZWxkIGlzIG5vIGxvbmdlciBtb2RpZmllZDpcblx0XHRcdFx0XHRcdGRlbGV0ZSBAX21vZGlmaWVkW25hbWVdXG5cdFx0XHRcdFx0XHQjIFdlIG1pZ2h0IGhhdmUgcmVtb3ZlZCB0aGUgbGFzdCBtb2RpZmllZCBmaWVsZCwgc28gY2hlY2sgdG9cblx0XHRcdFx0XHRcdCMgc2VlIGlmIHRoZXJlIGFyZSBhbnkgbW9kaWZpZWQgZmllbGRzIHJlbWFpbmluZyBhbmQgY29ycmVjdCBkaXJ0eVxuXHRcdFx0XHRcdFx0QF9kaXJ0eSA9IE9iamVjdC5nZXRMZW5ndGgoQF9tb2RpZmllZCkgPiAwXG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRAX2RpcnR5ID0gdHJ1ZVxuXHRcdFx0XHRcdEBfbW9kaWZpZWRbbmFtZV0gPSBjdXJyZW50VmFsdWVcblxuXHRcdFx0aWYgbmFtZSBpcyBAaWRQcm9wZXJ0eVxuXHRcdFx0XHRpZENoYW5nZWQgPSB0cnVlXG5cdFx0XHRcdG9sZElkID0gY3VycmVudFZhbHVlXG5cdFx0XHRcdG5ld0lkID0gdmFsdWVcblxuXHRcdGlmIHNpbmdsZVxuXHRcdFx0IyBjbGVhbnVwIG91ciByZXVzZWQgb2JqZWN0IGZvciBuZXh0IHRpbWUuLi4gaW1wb3J0YW50IHRvIGRvIHRoaXMgYmVmb3JlXG5cdFx0XHQjIHdlIGZpcmUgYW55IGV2ZW50cyBvciBjYWxsIGFueW9uZSBlbHNlIChsaWtlIGFmdGVyRWRpdCkhXG5cdFx0XHRkZWxldGUgdmFsdWVzW2ZpZWxkTmFtZV1cblxuXHRcdEBlbWl0KFwiaWRjaGFuZ2VkXCIsIHRoaXMsIG9sZElkLCBuZXdJZCkgIGlmIGlkQ2hhbmdlZFxuXHRcdEBhZnRlckVkaXQobW9kaWZpZWRGaWVsZE5hbWVzKSAgaWYgIUBfZWRpdGluZyBhbmQgbW9kaWZpZWRGaWVsZE5hbWVzXG5cdFx0cmV0dXJuIG1vZGlmaWVkRmllbGROYW1lcyBvciBudWxsXG5cblxuXHRnZXRJZDogLT5cblx0XHRyZXR1cm4gQF9kYXRhW0BpZFByb3BlcnR5XVxuXG5cblx0c2V0SWQ6IChpZCkgLT5cblx0XHRAc2V0KEBpZFByb3BlcnR5LCBpZClcblx0XHRAX3BoYW50b20gPSAhKGlkIG9yIGlkIGlzIDApXG5cdFx0cmV0dXJuXG5cblxuXHR1cGRhdGluZzogKGNhbGxiYWNrKSAtPlxuXHRcdGVkaXRpbmcgPSBAX2VkaXRpbmdcblx0XHRAYmVnaW5FZGl0KCkgaWYgIWVkaXRpbmdcblx0XHRjYWxsYmFjayhAX2RhdGEpXG5cdFx0QGVuZEVkaXQoKSBpZiAhZWRpdGluZ1xuXHRcdHJldHVyblxuXG5cblx0IyMjKlxuXHQgIEdldHMgYWxsIHZhbHVlcyBmb3IgZWFjaCBmaWVsZCBpbiB0aGlzIG1vZGVsIGFuZCByZXR1cm5zIGFuIG9iamVjdCBjb250YWluaW5nIHRoZSBjdXJyZW50IGRhdGEuXG5cdCAgQHJldHVybiB7T2JqZWN0fSBBbiBvYmplY3QgaGFzaCBjb250YWluaW5nIGFsbCB0aGUgdmFsdWVzIGluIHRoaXMgbW9kZWxcblx0ICAjIyNcblx0Z2V0VmFsdWVzOiAtPlxuXHRcdHZhbHVlcyA9IHt9XG5cdFx0Zm9yIG5hbWUsZmllbGQgb2YgQGZpZWxkcyB0aGVuIHZhbHVlc1tuYW1lXSA9IEBnZXQobmFtZSlcblx0XHRyZXR1cm4gdmFsdWVzXG5cblxuXHQjIEJlZ2lucyBhbiBlZGl0LiBXaGlsZSBpbiBlZGl0IG1vZGUsIG5vIGV2ZW50cyAoZS5nLi4gdGhlIGB1cGRhdGVgIGV2ZW50KSBhcmUgcmVsYXllZCB0byB0aGUgY29udGFpbmluZyBzdG9yZS5cblx0IyBXaGVuIGFuIGVkaXQgaGFzIGJlZ3VuLCBpdCBtdXN0IGJlIGZvbGxvd2VkIGJ5IGVpdGhlciB7QGxpbmsgI2VuZEVkaXR9IG9yIHtAbGluayAjY2FuY2VsRWRpdH0uXG5cdGJlZ2luRWRpdDogLT5cblx0XHRpZiAhQF9lZGl0aW5nXG5cdFx0XHRAX2VkaXRpbmcgPSB0cnVlXG5cdFx0XHRAX2RpcnR5U2F2ZWQgPSBAX2RpcnR5XG5cdFx0XHRAX2RhdGFTYXZlZCA9IHt9XG5cdFx0XHRAX21vZGlmaWVkU2F2ZWQgPSB7fVxuXHRcdFx0QF9kYXRhU2F2ZWRba2V5XSA9IHZhbHVlICBmb3Iga2V5LCB2YWx1ZSBvZiBAX2RhdGFcblx0XHRcdEBfbW9kaWZpZWRTYXZlZFtrZXldID0gdmFsdWUgIGZvciBrZXksdmFsdWUgb2YgQF9tb2RpZmllZFxuXHRcdHJldHVyblxuXG5cblx0IyBDYW5jZWxzIGFsbCBjaGFuZ2VzIG1hZGUgaW4gdGhlIGN1cnJlbnQgZWRpdCBvcGVyYXRpb24uXG5cdGNhbmNlbEVkaXQ6IC0+XG5cdFx0aWYgQF9lZGl0aW5nXG5cdFx0XHRAX2VkaXRpbmcgPSBmYWxzZVxuXHRcdFx0QF9kaXJ0eSA9IEBfZGlydHlTYXZlZFxuXHRcdFx0QF9kYXRhID0gQF9kYXRhU2F2ZWRcblx0XHRcdEBfbW9kaWZpZWQgPSBAX21vZGlmaWVkU2F2ZWRcblx0XHRcdGRlbGV0ZSBAX2RpcnR5U2F2ZWRcblx0XHRcdGRlbGV0ZSBAX2RhdGFTYXZlZFxuXHRcdFx0ZGVsZXRlIEBfbW9kaWZpZWRTYXZlZFxuXHRcdHJldHVyblxuXG5cblx0IyBFbmRzIGFuIGVkaXQuIElmIGFueSBkYXRhIHdhcyBtb2RpZmllZCwgdGhlIGNvbnRhaW5pbmcgc3RvcmUgaXMgbm90aWZpZWQgKGllLCB0aGUgc3RvcmUncyBgdXBkYXRlYCBldmVudCB3aWxsIGZpcmUpLlxuXHQjIEBwYXJhbSB7Qm9vbGVhbn0gc2lsZW50IFRydWUgdG8gbm90IG5vdGlmeSB0aGUgc3RvcmUgb2YgdGhlIGNoYW5nZVxuXHQjIEBwYXJhbSB7U3RyaW5nW119IG1vZGlmaWVkRmllbGROYW1lcyBBcnJheSBvZiBmaWVsZCBuYW1lcyBjaGFuZ2VkIGR1cmluZyBlZGl0LlxuXHRlbmRFZGl0OiAoc2lsZW50LCBtb2RpZmllZEZpZWxkTmFtZXMpIC0+XG5cdFx0aWYgQF9lZGl0aW5nXG5cdFx0XHRAX2VkaXRpbmcgPSBmYWxzZVxuXHRcdFx0ZGF0YSA9IEBfZGF0YVNhdmVkXG5cdFx0XHRkZWxldGUgQF9tb2RpZmllZFNhdmVkXG5cdFx0XHRkZWxldGUgQF9kYXRhU2F2ZWRcblx0XHRcdGRlbGV0ZSBAX2RpcnR5U2F2ZWRcblx0XHRcdGlmICFzaWxlbnRcblx0XHRcdFx0bW9kaWZpZWRGaWVsZE5hbWVzID0gQGdldE1vZGlmaWVkRmllbGROYW1lcyhkYXRhKSBpZiAhbW9kaWZpZWRGaWVsZE5hbWVzXG5cdFx0XHRcdGNoYW5nZWQgPSBAX2RpcnR5IG9yIG1vZGlmaWVkRmllbGROYW1lcy5sZW5ndGggPiAwXG5cdFx0XHRcdGlmIGNoYW5nZWQgdGhlbiBAYWZ0ZXJFZGl0KG1vZGlmaWVkRmllbGROYW1lcylcblx0XHRyZXR1cm5cblxuXG5cdCMgR2V0cyB0aGUgbmFtZXMgb2YgYWxsIHRoZSBmaWVsZHMgdGhhdCB3ZXJlIG1vZGlmaWVkIGR1cmluZyBhbiBlZGl0XG5cdCMgQHByaXZhdGVcblx0IyBAcGFyYW0ge09iamVjdH0gW3ZhbHVlc10gVGhlIGN1cnJlbnRseSBzYXZlZCBkYXRhLiBEZWZhdWx0cyB0byB0aGUgZGF0YVNhdmUgcHJvcGVydHkgb24gdGhlIG9iamVjdC5cblx0IyBAcmV0dXJuIHtTdHJpbmdbXX0gQW4gYXJyYXkgb2YgbW9kaWZpZWQgZmllbGQgbmFtZXNcblx0Z2V0TW9kaWZpZWRGaWVsZE5hbWVzOiAodmFsdWVzKSAtPlxuXHRcdG1vZGlmaWVkID0gW11cblx0XHRmb3Iga2V5LHZhbHVlIG9mIEBfZGF0YVxuXHRcdFx0aWYgIUBpc0VxdWFsKHZhbHVlLCB2YWx1ZXNba2V5XSlcblx0XHRcdFx0bW9kaWZpZWQucHVzaChrZXkpXG5cdFx0cmV0dXJuIG1vZGlmaWVkXG5cblxuXHQjIEdldHMgYSBoYXNoIG9mIG9ubHkgdGhlIGZpZWxkcyB0aGF0IGhhdmUgYmVlbiBtb2RpZmllZCBzaW5jZSB0aGlzIE1vZGVsIHdhcyBjcmVhdGVkIG9yIGNvbW1pdGVkLlxuXHQjIEByZXR1cm4ge09iamVjdH1cblx0Z2V0Q2hhbmdlczogLT5cblx0XHRjaGFuZ2VzID0ge31cblx0XHRjaGFuZ2VzW25hbWVdID0gQGdldChuYW1lKSAgZm9yIG5hbWUsdmFsdWUgb2YgQF9tb2RpZmllZFxuXHRcdHJldHVybiBjaGFuZ2VzXG5cblxuXHQjIFJldHVybnMgdHJ1ZSBpZiB0aGUgcGFzc2VkIGZpZWxkIG5hbWUgaGFzIGJlZW4gYHtAbGluayAjbW9kaWZpZWR9YCBzaW5jZSB0aGUgbG9hZCBvciBsYXN0IGNvbW1pdC5cblx0IyBAcGFyYW0ge1N0cmluZ30gZmllbGROYW1lXG5cdCMgQHJldHVybiB7Qm9vbGVhbn1cblx0aXNNb2RpZmllZDogKGZpZWxkTmFtZSkgLT5cblx0XHRyZXR1cm4gQF9tb2RpZmllZC5oYXNPd25Qcm9wZXJ0eShmaWVsZE5hbWUpXG5cblxuXHQjIENoZWNrcyBpZiB0d28gdmFsdWVzIGFyZSBlcXVhbCwgdGFraW5nIGludG8gYWNjb3VudCBjZXJ0YWluIHNwZWNpYWwgZmFjdG9ycywgZm9yIGV4YW1wbGUgZGF0ZXMuXG5cdCMgQHByaXZhdGVcblx0IyBAcGFyYW0ge09iamVjdH0gYSBUaGUgZmlyc3QgdmFsdWVcblx0IyBAcGFyYW0ge09iamVjdH0gYiBUaGUgc2Vjb25kIHZhbHVlXG5cdCMgQHJldHVybiB7Qm9vbGVhbn0gVHJ1ZSBpZiB0aGUgdmFsdWVzIGFyZSBlcXVhbFxuXHRpc0VxdWFsOiAoYSwgYikgLT5cblx0XHRpZiBUeXBlLmlzT2JqZWN0KGEpIGFuZCBUeXBlLmlzT2JqZWN0KGIpXG5cdFx0XHRpZiBPYmplY3QuZ2V0TGVuZ3RoKGEpIGlzbnQgT2JqZWN0LmdldExlbmd0aChiKVxuXHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRcdGVsc2Vcblx0XHRcdFx0Zm9yIHggb2YgYSB0aGVuIGlmIGJbeF0gaXNudCBhW3hdIHRoZW4gcmV0dXJuIGZhbHNlXG5cdFx0XHRcdHJldHVybiB0cnVlXG5cdFx0ZWxzZSBpZiBUeXBlLmlzRGF0ZShhKSBhbmQgVHlwZS5pc0RhdGUoYilcblx0XHRcdHJldHVybiBhLmdldFRpbWUoKSBpcyBiLmdldFRpbWUoKVxuXHRcdGVsc2Vcblx0XHRcdHJldHVybiBhIGlzIGJcblxuXG5cdCMgTWFya3MgdGhpcyAqKlJlY29yZCoqIGFzIGB7QGxpbmsgI2RpcnR5fWAuIFRoaXMgbWV0aG9kIGlzIHVzZWQgaW50ZXJhbGx5IHdoZW4gYWRkaW5nIGB7QGxpbmsgI3BoYW50b219YCByZWNvcmRzXG5cdCMgdG8gYSB7QGxpbmsgRXh0LmRhdGEucHJveHkuU2VydmVyI3dyaXRlciB3cml0ZXIgZW5hYmxlZCBzdG9yZX0uXG5cdCMgTWFya2luZyBhIHJlY29yZCBge0BsaW5rICNkaXJ0eX1gIGNhdXNlcyB0aGUgcGhhbnRvbSB0byBiZSByZXR1cm5lZCBieSB7QGxpbmsgRXh0LmRhdGEuU3RvcmUjZ2V0VXBkYXRlZFJlY29yZHN9XG5cdCMgd2hlcmUgaXQgd2lsbCBoYXZlIGEgY3JlYXRlIGFjdGlvbiBjb21wb3NlZCBmb3IgaXQgZHVyaW5nIHtAbGluayBFeHQuZGF0YS5Nb2RlbCNzYXZlIG1vZGVsIHNhdmV9IG9wZXJhdGlvbnMuXG5cdHNldERpcnR5OiAtPlxuXHRcdEBfZGlydHkgPSB0cnVlXG5cdFx0Zm9yIG5hbWUsZmllbGQgb2YgQGZpZWxkc1xuXHRcdFx0aWYgZmllbGQucGVyc2lzdFxuXHRcdFx0XHRAX21vZGlmaWVkW25hbWVdID0gQGdldChuYW1lKVxuXHRcdHJldHVyblxuXG5cblx0IyBVc3VhbGx5IGNhbGxlZCBieSB0aGUge0BsaW5rIEV4dC5kYXRhLlN0b3JlfSB0byB3aGljaCB0aGlzIG1vZGVsIGluc3RhbmNlIGhhcyBiZWVuIHtAbGluayAjam9pbiBqb2luZWR9LiBSZWplY3RzXG5cdCMgYWxsIGNoYW5nZXMgbWFkZSB0byB0aGUgbW9kZWwgaW5zdGFuY2Ugc2luY2UgZWl0aGVyIGNyZWF0aW9uLCBvciB0aGUgbGFzdCBjb21taXQgb3BlcmF0aW9uLiBNb2RpZmllZCBmaWVsZHMgYXJlXG5cdCMgcmV2ZXJ0ZWQgdG8gdGhlaXIgb3JpZ2luYWwgdmFsdWVzLlxuXHQjXG5cdCMgRGV2ZWxvcGVycyBzaG91bGQgc3Vic2NyaWJlIHRvIHRoZSB7QGxpbmsgRXh0LmRhdGEuU3RvcmUjZXZlbnQtdXBkYXRlfSBldmVudCB0byBoYXZlIHRoZWlyIGNvZGUgbm90aWZpZWQgb2YgcmVqZWN0IG9wZXJhdGlvbnMuXG5cdCNcblx0IyBAcGFyYW0ge0Jvb2xlYW59IHNpbGVudCAob3B0aW9uYWwpIFRydWUgdG8gc2tpcCBub3RpZmljYXRpb24gb2YgdGhlIG93bmluZyBzdG9yZSBvZiB0aGUgY2hhbmdlLlxuXHRyZWplY3Q6IChzaWxlbnQgPSBmYWxzZSkgLT5cblx0XHRmb3IgbmFtZSx2YWx1ZSBvZiBAX21vZGlmaWVkXG5cdFx0XHRAX2RhdGFbbmFtZV0gPSB2YWx1ZVxuXHRcdEBfZGlydHkgPSBmYWxzZVxuXHRcdEBfZWRpdGluZyA9IGZhbHNlXG5cdFx0QF9tb2RpZmllZCA9IHt9XG5cdFx0aWYgIXNpbGVudCB0aGVuIEBhZnRlclJlamVjdCgpXG5cdFx0cmV0dXJuXG5cblxuXHQjIFVzdWFsbHkgY2FsbGVkIGJ5IHRoZSB7QGxpbmsgTWl3by5kYXRhLlN0b3JlfSB3aGljaCBvd25zIHRoZSBtb2RlbCBpbnN0YW5jZS4gQ29tbWl0cyBhbGwgY2hhbmdlcyBtYWRlIHRvIHRoZVxuXHQjIGluc3RhbmNlIHNpbmNlIGVpdGhlciBjcmVhdGlvbiBvciB0aGUgbGFzdCBjb21taXQgb3BlcmF0aW9uLlxuXHQjIEBwYXJhbSB7Qm9vbGVhbn0gc2lsZW50IChvcHRpb25hbCkgVHJ1ZSB0byBza2lwIG5vdGlmaWNhdGlvbiBvZiB0aGUgb3duaW5nIHN0b3JlIG9mIHRoZSBjaGFuZ2UuXG5cdGNvbW1pdDogKHNpbGVudCA9IGZhbHNlKSAtPlxuXHRcdEBfcGhhbnRvbSA9IEBfZGlydHkgPSBAX2VkaXRpbmcgPSBmYWxzZVxuXHRcdEBfbW9kaWZpZWQgPSB7fVxuXHRcdGlmICFzaWxlbnQgdGhlbiBAYWZ0ZXJDb21taXQoKVxuXHRcdHJldHVyblxuXG5cblx0IyMjKlxuXHQgIFRlbGxzIHRoaXMgbW9kZWwgaW5zdGFuY2UgdGhhdCBpdCBoYXMgYmVlbiBhZGRlZCB0byBhIHN0b3JlLlxuXHQgIEBwYXJhbSB7RXh0LmRhdGEuU3RvcmV9IHN0b3JlIFRoZSBzdG9yZSB0byB3aGljaCB0aGlzIG1vZGVsIGhhcyBiZWVuIGFkZGVkLlxuXHQgICMjI1xuXHRqb2luU3RvcmU6IChzdG9yZSkgLT5cblx0XHRAX3N0b3Jlcy5pbmNsdWRlKHN0b3JlKVxuXHRcdEBfc3RvcmUgPSBAX3N0b3Jlc1swXSAjIGNvbXBhdCB3L2FsbCByZWxlYXNlcyBldmVyXG5cdFx0cmV0dXJuXG5cblxuXHQjIyMqXG5cdCAgVGVsbHMgdGhpcyBtb2RlbCBpbnN0YW5jZSB0aGF0IGl0IGhhcyBiZWVuIHJlbW92ZWQgZnJvbSB0aGUgc3RvcmUuXG5cdCAgQHBhcmFtIHtFeHQuZGF0YS5TdG9yZX0gc3RvcmUgVGhlIHN0b3JlIGZyb20gd2hpY2ggdGhpcyBtb2RlbCBoYXMgYmVlbiByZW1vdmVkLlxuXHQgICMjI1xuXHR1bmpvaW5TdG9yZTogKHN0b3JlKSAtPlxuXHRcdEBfc3RvcmVzLmVyYXNlKHN0b3JlKVxuXHRcdEBfc3RvcmUgPSBAX3N0b3Jlc1swXSBvciBudWxsICMgY29tcGF0IHcvYWxsIHJlbGVhc2VzIGV2ZXJcblx0XHRyZXR1cm5cblxuXG5cdGlzU3RvcmVkOiAtPlxuXHRcdHJldHVybiBAX3N0b3JlIGlzbnQgbnVsbFxuXG5cblx0aXNQaGFudG9tOiAtPlxuXHRcdHJldHVybiBAX3BoYW50b21cblxuXG5cdCMjIypcblx0ICBAcHJpdmF0ZVxuXHQgIElmIHRoaXMgTW9kZWwgaW5zdGFuY2UgaGFzIGJlZW4ge0BsaW5rICNqb2luIGpvaW5lZH0gdG8gYSB7QGxpbmsgRXh0LmRhdGEuU3RvcmUgc3RvcmV9LCB0aGUgc3RvcmUnc1xuXHQgIGFmdGVyRWRpdCBtZXRob2QgaXMgY2FsbGVkXG5cdCAgQHBhcmFtIHtTdHJpbmdbXX0gbW9kaWZpZWRGaWVsZE5hbWVzIEFycmF5IG9mIGZpZWxkIG5hbWVzIGNoYW5nZWQgZHVyaW5nIGVkaXQuXG5cdCAgIyMjXG5cdGFmdGVyRWRpdDogKG1vZGlmaWVkRmllbGROYW1lcykgLT5cblx0XHRAZW1pdChcImVkaXRcIiwgdGhpcywgbW9kaWZpZWRGaWVsZE5hbWVzKVxuXHRcdEBjYWxsU3RvcmUoXCJhZnRlckVkaXRcIiwgdGhpcywgbW9kaWZpZWRGaWVsZE5hbWVzKVxuXHRcdHJldHVyblxuXG5cblx0IyBAcHJpdmF0ZVxuXHQjIElmIHRoaXMgTW9kZWwgaW5zdGFuY2UgaGFzIGJlZW4ge0BsaW5rICNqb2luIGpvaW5lZH0gdG8gYSB7QGxpbmsgRXh0LmRhdGEuU3RvcmUgc3RvcmV9LCB0aGUgc3RvcmUnc1xuXHQjIGFmdGVyUmVqZWN0IG1ldGhvZCBpcyBjYWxsZWRcblx0YWZ0ZXJSZWplY3Q6IC0+XG5cdFx0QGNhbGxTdG9yZShcImFmdGVyUmVqZWN0XCIsIHRoaXMpXG5cdFx0cmV0dXJuXG5cblxuXHQjIEBwcml2YXRlXG5cdCMgSWYgdGhpcyBNb2RlbCBpbnN0YW5jZSBoYXMgYmVlbiB7QGxpbmsgI2pvaW4gam9pbmVkfSB0byBhIHtAbGluayBFeHQuZGF0YS5TdG9yZSBzdG9yZX0sIHRoZSBzdG9yZSdzXG5cdCMgYWZ0ZXJDb21taXQgbWV0aG9kIGlzIGNhbGxlZFxuXHRhZnRlckNvbW1pdDogLT5cblx0XHRAY2FsbFN0b3JlKFwiYWZ0ZXJDb21taXRcIiwgdGhpcylcblx0XHRyZXR1cm5cblxuXG5cdCMgQHByaXZhdGVcblx0IyBIZWxwZXIgZnVuY3Rpb24gdXNlZCBieSBhZnRlckVkaXQsIGFmdGVyUmVqZWN0IGFuZCBhZnRlckNvbW1pdC4gQ2FsbHMgdGhlIGdpdmVuIG1ldGhvZCBvbiB0aGVcblx0IyB7QGxpbmsgTWl3by5kYXRhLlN0b3JlIHN0b3JlfSB0aGF0IHRoaXMgaW5zdGFuY2UgaGFzIHtAbGluayAjam9pbiBqb2luZWR9LCBpZiBhbnkuIFRoZSBzdG9yZSBmdW5jdGlvblxuXHQjIHdpbGwgYWx3YXlzIGJlIGNhbGxlZCB3aXRoIHRoZSBtb2RlbCBpbnN0YW5jZSBhcyBpdHMgc2luZ2xlIGFyZ3VtZW50LlxuXHQjIEBwYXJhbSB7U3RyaW5nfSBmbiBUaGUgZnVuY3Rpb24gdG8gY2FsbCBvbiB0aGUgc3RvcmVcblx0Y2FsbFN0b3JlOiAoZm4sIGFyZ3MuLi4pIC0+XG5cdFx0Zm9yIHN0b3JlIGluIEBfc3RvcmVzXG5cdFx0XHRpZiBzdG9yZVtmbl1cblx0XHRcdFx0c3RvcmVbZm5dLmFwcGx5KHN0b3JlLCBhcmdzKVxuXHRcdHJldHVyblxuXG5cblx0IyBvdmVycmlkZVxuXHRvblZhbHVlQ2hhbmdlZDogKG5hbWUsIHZhbHVlLCBvbGR2YWx1ZSkgLT5cblx0XHRyZXR1cm5cblxuXG5cbm1vZHVsZS5leHBvcnRzID0gUmVjb3JkXG4iLCJjbGFzcyBTb3J0ZXIgZXh0ZW5kcyBNaXdvLk9iamVjdFxuXG5cdG5hbWU6IG51bGxcblx0ZGlyOiBudWxsXG5cblxuXHRjb21wYXJlOiAoYSwgYikgLT5cblx0XHRpZiBUeXBlLmlzRnVuY3Rpb24oQGRpcilcblx0XHRcdHJldHVybiBAZGlyKGEsIGIpXG5cdFx0ZWxzZVxuXHRcdFx0YVZhbCA9IGEuZ2V0KEBuYW1lKVxuXHRcdFx0YlZhbCA9IGIuZ2V0KEBuYW1lKVxuXHRcdFx0c2lnbiA9IChpZiBAZGlyIGlzIFwiZGVzY1wiIHRoZW4gLTEgZWxzZSAxKVxuXHRcdFx0aWYgVHlwZS5pc0RhdGUoYVZhbCkgYW5kIFR5cGUuaXNEYXRlKGJWYWwpXG5cdFx0XHRcdGlmIGFWYWwgLSBiVmFsID4gMCB0aGVuIHJldHVybiBzaWduXG5cdFx0XHRcdGlmIGFWYWwgLSBiVmFsIDwgMCB0aGVuIHJldHVybiAtc2lnblxuXHRcdFx0ZWxzZVxuXHRcdFx0XHRpZiBhVmFsID4gYlZhbCB0aGVuIHJldHVybiBzaWduXG5cdFx0XHRcdGlmIGFWYWwgPCBiVmFsIHRoZW4gcmV0dXJuIC1zaWduXG5cdFx0XHRyZXR1cm4gbnVsbFxuXG5cblx0dG9EYXRhOiAtPlxuXHRcdG5hbWU6IEBuYW1lXG5cdFx0ZGlyOiBAZGlyXG5cblxubW9kdWxlLmV4cG9ydHMgPSBTb3J0ZXIiLCJTdG9yZUZpbHRlcnMgPSByZXF1aXJlICcuL1N0b3JlRmlsdGVycydcblN0b3JlU29ydGVycyA9IHJlcXVpcmUgJy4vU3RvcmVTb3J0ZXJzJ1xuXG5cblxuY2xhc3MgU3RvcmUgZXh0ZW5kcyBNaXdvLk9iamVjdFxuXG5cdCMgQGV2ZW50IHJlZnJlc2goc3RvcmUpIGVtaXRlZCBieSBzb3J0ZXJzIG9yIGZpbHRlcnNcblx0IyBAZXZlbnQgYWRkKHN0b3JlLHJlY29yZHMsaW5kZXgpXG5cdCMgQGV2ZW50IGRhdGFjaGFuZ2VkKHN0b3JlKVxuXHQjIEBldmVudCBiZWZvcmVsb2FkKHN0b3JlLCBvcGVyYXRpb24pXG5cdCMgQGV2ZW50IGxvYWQoc3RvcmUsIHJlY29yZHMsIHN1Y2Nlc3MpXG5cdCMgQGV2ZW50IHJlZWxvYWQoc3RvcmUpXG5cdCMgQGV2ZW50IHJlbW92ZShzdG9yZSwgcmVjb3JkLCBpbmRleClcblx0IyBAZXZlbnQgcmVtb3ZlYWxsKHN0b3JlKVxuXHQjIEBldmVudCB1cGRhdGUoc3RvcmUsIHJlY29yZCwgb3BlcmF0aW9uLCBtb2RpZmllZEZpZWxkTmFtZXMpXG5cdCMgQGV2ZW50IHdyaXRlKHN0b3JlLCBvcGVyYXRpb24pXG5cblx0aXNTdG9yZTogdHJ1ZVxuXHRuYW1lOiBudWxsXG5cdGVudGl0eTogbnVsbFxuXHRmaWVsZHM6IG51bGxcblx0aWRQcm9wZXJ0eTogJ2lkJ1xuXG5cdGRhdGE6IG51bGxcblx0bmV3UmVjb3JkczogbnVsbFxuXHRyZW1vdmVkUmVjb3JkczogbnVsbFxuXHR1cGRhdGVkUmVjb3JkczogbnVsbFxuXG5cdGF1dG9Mb2FkOiBmYWxzZVxuXHRhdXRvU3luYzogZmFsc2Vcblx0YXV0b1N5bmNSZWxvYWQ6IGZhbHNlXG5cdGF1dG9TeW5jU3VzcGVuZGVkOiBmYWxzZVxuXHRyZW1vdGVGaWx0ZXI6IGZhbHNlXG5cdHJlbW90ZVNvcnQ6IGZhbHNlXG5cdHByb3h5OiBudWxsXG5cblx0c3RvcmVGaWx0ZXJzOiBudWxsXG5cdGZpbHRlcmVkRGF0YTogbnVsbFxuXHRmaWx0ZXJPbkxvYWQ6IHRydWVcblx0ZmlsdGVyT25FZGl0OiB0cnVlXG5cdGZpbHRlcmVkOiBmYWxzZVxuXHRmaWx0ZXI6IG51bGxcblx0QGdldHRlciAnZmlsdGVycycsICgpIC0+IHJldHVybiBAZ2V0RmlsdGVycygpXG5cblx0c3RvcmVTb3J0ZXJzOiBudWxsXG5cdHNvcnRPbkxvYWQ6IHRydWVcblx0c29ydE9uRWRpdDogdHJ1ZVxuXHRzb3J0OiBudWxsXG5cdEBnZXR0ZXIgJ3NvcnRlcnMnLCAoKSAtPiByZXR1cm4gQGdldFNvcnRlcnMoKVxuXG5cdHBhZ2VTaXplOiBudWxsXG5cdGxvYWRpbmc6IGZhbHNlXG5cdGxvYWRlZDogZmFsc2Vcblx0dG90YWxDb3VudDogMFxuXHRwYWdlOiAxXG5cdHBhcmFtczogbnVsbFxuXG5cblx0Y29uc3RydWN0b3I6IChjb25maWcgPSB7fSkgLT5cblx0XHRzdXBlcihjb25maWcpXG5cblx0XHRAbmV3UmVjb3JkcyA9IFtdXG5cdFx0QHJlbW92ZWRSZWNvcmRzID0gW11cblx0XHRAdXBkYXRlZFJlY29yZHMgPSBbXVxuXG5cdFx0aWYgY29uZmlnLmVudGl0eVxuXHRcdFx0QGVudGl0eSA9IGNvbmZpZy5lbnRpdHlcblxuXHRcdGlmICFAZW50aXR5IGFuZCBAZmllbGRzXG5cdFx0XHRAZW50aXR5ID0gbWl3by5lbnRpdHlNZ3IuY3JlYXRlRW50aXR5Q2xhc3Moe2ZpZWxkczogQGZpZWxkcywgaWRQcm9wZXJ0eTogQGlkUHJvcGVydHl9KVxuXHRcdFx0ZGVsZXRlIEBmaWVsZHNcblx0XHRcdGRlbGV0ZSBAaWRQcm9wZXJ0eVxuXG5cdFx0aWYgIUBlbnRpdHlcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIlVuc3BlY2lmaWVkIGVudGl0eSBvciBmaWVsZHMgZm9yIHN0b3JlICN7dGhpc31cIilcblxuXHRcdGlmICFAcHJveHkgJiYgQGFwaVxuXHRcdFx0QHByb3h5ID0ge2FwaTogQGFwaX1cblx0XHRcdGRlbGV0ZSBAYXBpXG5cblx0XHRpZiBAcHJveHkgfHwgQGFwaVxuXHRcdFx0cHJveHlNZ3IgPSBtaXdvLnByb3h5TWdyXG5cdFx0XHRpZiBUeXBlLmlzU3RyaW5nKEBwcm94eSlcblx0XHRcdFx0QHByb3h5ID0gcHJveHlNZ3IuZ2V0KEBwcm94eSlcblx0XHRcdGVsc2UgaWYgVHlwZS5pc09iamVjdChAcHJveHkpXG5cdFx0XHRcdEBwcm94eSA9IHByb3h5TWdyLmNyZWF0ZVByb3h5KEBwcm94eSlcblx0XHRlbHNlIGlmIEBlbnRpdHkucHJveHlcblx0XHRcdHByb3h5TWdyID0gbWl3by5wcm94eU1nclxuXHRcdFx0aWYgVHlwZS5pc1N0cmluZyhAZW50aXR5LnByb3h5KVxuXHRcdFx0XHRAcHJveHkgPSBwcm94eU1nci5nZXQoQGVudGl0eS5wcm94eSlcblx0XHRcdGVsc2UgaWYgVHlwZS5pc09iamVjdChAZW50aXR5LnByb3h5KVxuXHRcdFx0XHRAcHJveHkgPSBwcm94eU1nci5jcmVhdGVQcm94eShAZW50aXR5LnByb3h5KVxuXG5cdFx0IyByZWdpc3RlciBuYW1lZCBzdG9yZSwgaWYgbm90IHJlZ2lzdGVyZWRcblx0XHRpZiBAbmFtZVxuXHRcdFx0aWYgIW1pd28uc3RvcmVNZ3IuaGFzKEBuYW1lKVxuXHRcdFx0XHRtaXdvLnN0b3JlTWdyLnJlZ2lzdGVyKEBuYW1lLCB0aGlzKVxuXG5cdFx0aWYgQHNvcnRcblx0XHRcdEBnZXRTb3J0ZXJzKCkuc2V0KEBzb3J0KVxuXG5cdFx0aWYgQGZpbHRlclxuXHRcdFx0QGdldEZpbHRlcnMoKS5zZXQoQGZpbHRlcilcblxuXHRcdEBkYXRhID0gW11cblx0XHRAaW5pdCgpXG5cblx0XHRpZiBAYXV0b0xvYWRcblx0XHRcdEBsb2FkKClcblx0XHRyZXR1cm5cblxuXG5cdGluaXQ6IC0+XG5cdFx0cmV0dXJuXG5cblx0Z2V0QWxsOiAtPlxuXHRcdHJldHVybiBAZGF0YVxuXG5cblx0Z2V0TGFzdDogLT5cblx0XHRyZXR1cm4gQGRhdGEuZ2V0TGFzdCgpXG5cblxuXHRnZXRGaXJzdDogLT5cblx0XHRyZXR1cm4gQGRhdGFbMF1cblxuXG5cdGdldENvdW50OiAtPlxuXHRcdHJldHVybiBAZGF0YS5sZW5ndGhcblxuXG5cdGdldEF0OiAoaW5kZXgpIC0+XG5cdFx0cmV0dXJuIGlmIGluZGV4IDwgQGRhdGEubGVuZ3RoIHRoZW4gQGRhdGFbaW5kZXhdIGVsc2UgbnVsbFxuXG5cblx0Z2V0QnlJZDogKGlkKSAtPlxuXHRcdGZvciByZWMgaW4gQGRhdGFcblx0XHRcdGlmIGByZWMuaWQgPT0gaWRgXG5cdFx0XHRcdHJldHVybiByZWNcblx0XHRyZXR1cm4gbnVsbFxuXG5cblx0YXR0YWNoUmVjb3JkOiAocmVjKSAtPlxuXHRcdHJlYy5qb2luU3RvcmUodGhpcylcblx0XHRyZXR1cm5cblxuXG5cdGRldGFjaFJlY29yZDogKHJlYykgLT5cblx0XHRyZWMudW5qb2luU3RvcmUodGhpcylcblx0XHRyZXR1cm5cblxuXG5cdGlzTG9hZGluZzogLT5cblx0XHRyZXR1cm4gQGxvYWRpbmdcblxuXG5cdGlzRmlsdGVyZWQ6IC0+XG5cdFx0cmV0dXJuIEBmaWx0ZXJlZFxuXG5cblx0Z2V0VG90YWxDb3VudDogLT5cblx0XHRyZXR1cm4gQHRvdGFsQ291bnRcblxuXG5cdGdldE1vZGlmaWVkUmVjb3JkczogKCkgLT5cblx0XHRyZXR1cm4gW10uY29uY2F0KEBnZXROZXdSZWNvcmRzKCksIEBnZXRVcGRhdGVkUmVjb3JkcygpKVxuXG5cblx0Z2V0TmV3UmVjb3JkczogLT5cblx0XHRyZXR1cm4gQG5ld1JlY29yZHNcblxuXG5cdGdldFJlbW92ZWRSZWNvcmRzOiAtPlxuXHRcdHJldHVybiBAcmVtb3ZlZFJlY29yZHNcblxuXG5cdGdldFVwZGF0ZWRSZWNvcmRzOiAtPlxuXHRcdHJldHVybiBAdXBkYXRlZFJlY29yZHNcblxuXG5cdGdldFJlY29yZHM6IC0+XG5cdFx0cmV0dXJuIGlmIEBmaWx0ZXJlZCB0aGVuIEBmaWx0ZXJlZERhdGEgZWxzZSBAZGF0YVxuXG5cblx0ZWFjaDogKGNhbGxiYWNrKSAtPlxuXHRcdEBkYXRhLmVhY2goY2FsbGJhY2spXG5cdFx0cmV0dXJuXG5cblxuXHRsb2FkUmVjb3JkczogKHJlY3MsIGNsZWFyID0gZmFsc2UpIC0+XG5cdFx0aWYgY2xlYXJcblx0XHRcdEBjbGVhcigpXG5cblx0XHRmb3IgcmVjIGluIHJlY3Ncblx0XHRcdEBkYXRhLnB1c2gocmVjKVxuXHRcdFx0QGF0dGFjaFJlY29yZChyZWMpXG5cblx0XHRpZiBAc29ydE9uTG9hZCAmJiAhQHJlbW90ZVNvcnQgJiYgQHN0b3JlU29ydGVycyAmJiBAc3RvcmVTb3J0ZXJzLmhhcygpXG5cdFx0XHRAc3RvcmVTb3J0ZXJzLmFwcGx5KHRydWUpXG5cblx0XHRpZiBAZmlsdGVyT25Mb2FkICYmICFAcmVtb3RlRmlsdGVyICYmIEBzdG9yZUZpbHRlcnMgJiYgQHN0b3JlRmlsdGVycy5oYXMoKVxuXHRcdFx0QHN0b3JlRmlsdGVycy5hcHBseSh0cnVlKVxuXG5cdFx0QGVtaXQoJ2RhdGFjaGFuZ2VkJywgdGhpcylcblx0XHRyZXR1cm5cblxuXG5cdHNldERhdGE6IChkYXRhLCBjbGVhcikgLT5cblx0XHRyZWNvcmRzID0gW11cblx0XHRmb3IgdmFsdWVzIGluIGRhdGFcblx0XHRcdHJlY29yZHMucHVzaChAY3JlYXRlUmVjb3JkKHZhbHVlcykpXG5cdFx0QGxvYWRSZWNvcmRzKHJlY29yZHMsIGNsZWFyKVxuXHRcdEBlbWl0KFwibG9hZFwiLCB0aGlzLCByZWNvcmRzKVxuXHRcdHJldHVyblxuXG5cblx0IyBDcmVhdGVzIHJlY29yZFxuXHQjIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZXNcblx0IyBAcmV0dXJucyB7TWl3by5kYXRhLlJlY29yZH1cblx0Y3JlYXRlUmVjb3JkOiAodmFsdWVzKSAtPlxuXHRcdHJldHVybiBtaXdvLmVudGl0eU1nci5jcmVhdGUoQGVudGl0eSwgdmFsdWVzKVxuXG5cblxuXHRzZXRQcm94eTogKHByb3h5KSAtPlxuXHRcdEBwcm94eSA9IHByb3h5XG5cdFx0cmV0dXJuXG5cblxuXHRnZXRQcm94eTogLT5cblx0XHRyZXR1cm4gQHByb3h5XG5cblxuXHQjLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXHQjIERhdGEgZmluZGluZ1xuXG5cblx0aW5kZXhPZjogKGZpbmQsIGZpbmRJbkZpbHRlcmVkKSAtPlxuXHRcdHNvdXJjZSA9IGlmICFmaW5kSW5GaWx0ZXJlZCB8fCBmaW5kSW5GaWx0ZXJlZCAmJiAhQGZpbHRlcmVkIHRoZW4gQGRhdGEgZWxzZSBAZmlsdGVyZWREYXRhXG5cdFx0Zm9yIHJlYyxpbmRleCBpbiBzb3VyY2Vcblx0XHRcdGlmIHJlYyBpcyBmaW5kXG5cdFx0XHRcdHJldHVybiBpbmRleFxuXHRcdHJldHVybiBudWxsXG5cblxuXHRpbmRleE9mSWQ6IChpZCkgLT5cblx0XHRmb3IgcmVjLGluZGV4IGluIEBkYXRhXG5cdFx0XHRpZiByZWMuZ2V0SWQoKSBpcyBpZFxuXHRcdFx0XHRyZXR1cm4gaW5kZXhcblx0XHRyZXR1cm4gbnVsbFxuXG5cblx0ZmluZEF0Qnk6IChjYWxsYmFjaykgLT5cblx0XHRmb3IgcmVjLGluZGV4IGluIEBkYXRhXG5cdFx0XHRpZiBjYWxsYmFjayhyZWMsaW5kZXgpXG5cdFx0XHRcdHJldHVybiBpbmRleFxuXHRcdHJldHVybiBudWxsXG5cblxuXHRmaW5kQXRSZWNvcmQ6IChmaWVsZE5hbWUsIHZhbHVlLCBvcCwgc3RhcnRJbmRleCkgLT5cblx0XHRyZXR1cm4gQGZpbmRBdEJ5KEBjcmVhdGVGaW5kZXJDYWxsYmFjayhmaWVsZE5hbWUsIHZhbHVlLCBvcCwgc3RhcnRJbmRleCkpXG5cblxuXHRmaW5kQXRFeGFjdDogKGZpZWxkTmFtZSwgdmFsdWUsIHN0YXJ0SW5kZXgpIC0+XG5cdFx0cmV0dXJuIEBmaW5kQXRSZWNvcmQoZmllbGROYW1lLCB2YWx1ZSwgXCI9PT1cIiwgc3RhcnRJbmRleClcblxuXG5cdGZpbmRCeTogKGNhbGxiYWNrKSAtPlxuXHRcdGZvciByZWMgaW4gQGRhdGFcblx0XHRcdGlmIGNhbGxiYWNrKHJlYylcblx0XHRcdFx0cmV0dXJuIHJlY1xuXHRcdHJldHVybiBudWxsXG5cblxuXHRmaW5kUmVjb3JkOiAoZmllbGROYW1lLCB2YWx1ZSwgb3AsIHN0YXJ0SW5kZXgpIC0+XG5cdFx0cmV0dXJuIEBmaW5kQnkoQGNyZWF0ZUZpbmRlckNhbGxiYWNrKGZpZWxkTmFtZSwgdmFsdWUsIG9wLCBzdGFydEluZGV4KSlcblxuXG5cdGZpbmRFeGFjdDogKGZpZWxkTmFtZSwgdmFsdWUsIHN0YXJ0SW5kZXgpIC0+XG5cdFx0cmV0dXJuIEBmaW5kUmVjb3JkKGZpZWxkTmFtZSwgdmFsdWUsIFwiPT09XCIsIHN0YXJ0SW5kZXgpXG5cblxuXHRmaW5kQWxsQnk6IChjYWxsYmFjaykgLT5cblx0XHRmaW5kID0gW11cblx0XHRmb3IgcmVjIGluIEBkYXRhXG5cdFx0XHRpZiBjYWxsYmFjayhyZWMpXG5cdFx0XHRcdGZpbmQucHVzaChyZWMpXG5cdFx0cmV0dXJuIGZpbmRcblxuXG5cdGZpbmRBbGxBdDogKGluZGV4LCBjb3VudCA9IDEpIC0+XG5cdFx0aW5kZXhUbyA9IGluZGV4ICsgY291bnRcblx0XHRmaW5kID0gW11cblx0XHRmb3IgcmVjLGkgaW4gQGRhdGFcblx0XHRcdGlmIGkgPj0gaW5kZXggJiYgaSA8IGluZGV4VG9cblx0XHRcdFx0ZmluZC5wdXNoKHJlYylcblx0XHRyZXR1cm4gZmluZFxuXG5cblx0ZmluZFJlY29yZHM6IChmaWVsZE5hbWUsIHZhbHVlLCBvcCwgc3RhcnRJbmRleCkgLT5cblx0XHRyZXR1cm4gQGZpbmRBbGxCeShAY3JlYXRlRmluZGVyQ2FsbGJhY2soZmllbGROYW1lLCB2YWx1ZSwgb3AsIHN0YXJ0SW5kZXgpKVxuXG5cblx0Y3JlYXRlRmluZGVyQ2FsbGJhY2s6IChmaWVsZE5hbWUsIHZhbHVlLCBvcCA9IFwiP1wiLCBzdGFydEluZGV4ID0gbnVsbCkgLT5cblx0XHRyZXR1cm4gKHJlYywgaW5kZXgpID0+XG5cdFx0XHRpZiBzdGFydEluZGV4IGlzIG51bGwgfHwgaW5kZXggPj0gc3RhcnRJbmRleFxuXHRcdFx0XHRyZWN2YWwgPSByZWMuZ2V0KGZpZWxkTmFtZSlcblx0XHRcdFx0c3dpdGNoIG9wXG5cdFx0XHRcdFx0d2hlbiBcIj09PVwiXG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZSAgaWYgcmVjdmFsIGlzIHZhbHVlXG5cdFx0XHRcdFx0d2hlbiBcIj09XCJcblx0XHRcdFx0XHRcdHJldHVybiB0cnVlICBpZiByZWN2YWwgaXMgdmFsdWVcblx0XHRcdFx0XHR3aGVuIFwiPVwiXG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZSAgaWYgcmVjdmFsLnRvU3RyaW5nKCkudGVzdCh2YWx1ZSlcblx0XHRcdFx0XHR3aGVuIFwiP1wiXG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZSAgaWYgcmVjdmFsLnRvU3RyaW5nKCkudGVzdCh2YWx1ZSwgXCJpXCIpXG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biBvcGVyYXRvciBcIiArIG9wKVxuXHRcdFx0cmV0dXJuIGZhbHNlXG5cblxuXHQjLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXHQjIERhdGEgaW5zZXJ0aW5nXG5cblxuXHRhZGQ6IChyZWNzKSAtPlxuXHRcdHJlY3MgPSBBcnJheS5mcm9tKHJlY3MpXG5cdFx0YWRkZWQgPSBmYWxzZVxuXHRcdGlmIHJlY3MubGVuZ3RoIGlzIDBcblx0XHRcdHJldHVyblxuXHRcdGZvciByZWMgaW4gcmVjc1xuXHRcdFx0YWRkZWQgPSB0cnVlXG5cdFx0XHRAZGF0YS5wdXNoKHJlYylcblx0XHRcdEBuZXdSZWNvcmRzLnB1c2gocmVjKVxuXHRcdFx0QHJlbW92ZWRSZWNvcmRzLmVyYXNlKHJlYylcblx0XHRcdGlmIEBmaWx0ZXJlZCBhbmQgQGdldEZpbHRlcnMoKS5tYXRjaChyZWMpIHRoZW4gQGZpbHRlcmVkRGF0YS5wdXNoKHJlYylcblx0XHRcdEBhdHRhY2hSZWNvcmQocmVjKVxuXHRcdFx0QGVtaXQoJ2FkZCcsIHRoaXMsIHJlYylcblx0XHRpZiBhZGRlZFxuXHRcdFx0QGVtaXQoJ2RhdGFjaGFuZ2VkJywgdGhpcylcblx0XHRyZXR1cm4gdGhpc1xuXG5cblx0aW5zZXJ0OiAoaW5kZXgsIHJlY3MsIHJldmVyc2VkKSAtPlxuXHRcdHJlY3MgPSBBcnJheS5mcm9tKHJlY3MpXG5cdFx0aWYgcmVjcy5sZW5ndGggaXMgMFxuXHRcdFx0cmV0dXJuXG5cdFx0Zm9yIHJlYyxpIGluIHJlY3Ncblx0XHRcdHBvcyA9IChpZiByZXZlcnNlZCB0aGVuIDAgZWxzZSBpbmRleCArIGkpXG5cdFx0XHRAZGF0YS5pbnNlcnQocG9zLCByZWMpXG5cdFx0XHRAbmV3UmVjb3Jkcy5wdXNoKHJlYylcblx0XHRcdEByZW1vdmVkUmVjb3Jkcy5lcmFzZShyZWMpXG5cdFx0XHRpZiBAZmlsdGVyZWQgYW5kIEBnZXRGaWx0ZXJzKCkubWF0Y2gocmVjKSB0aGVuIEBmaWx0ZXJlZERhdGEucHVzaChyZWMpXG5cdFx0XHRAYXR0YWNoUmVjb3JkKHJlYylcblx0XHRcdEBlbWl0KCdhZGQnLCB0aGlzLCByZWMsIHBvcylcblx0XHRAZW1pdChcImRhdGFjaGFuZ2VkXCIsIHRoaXMpXG5cdFx0cmV0dXJuIHRoaXNcblxuXG5cdCMjIypcblx0ICAoTG9jYWwgc29ydCBvbmx5KSBJbnNlcnRzIHRoZSBwYXNzZWQgUmVjb3JkIGludG8gdGhlIFN0b3JlIGF0IHRoZSBpbmRleCB3aGVyZSBpdFxuXHQgIHNob3VsZCBnbyBiYXNlZCBvbiB0aGUgY3VycmVudCBzb3J0IGluZm9ybWF0aW9uLlxuXHQgIEBwYXJhbSB7TWl3by5kYXRhLlJlY29yZH0gcmVjb3JkXG5cdCAgIyMjXG5cdGFkZFNvcnRlZDogKHJlY29yZCkgLT5cblx0XHRpbmRleCA9IGlmIEBzdG9yZVNvcnRlcnMgdGhlbiBAc3RvcmVTb3J0ZXJzLmdldEluZGV4KHJlY29yZCkgZWxzZSBAZGF0YS5sZW5ndGhcblx0XHRAaW5zZXJ0KGluZGV4LCByZWNvcmQpXG5cdFx0cmV0dXJuIHJlY29yZFxuXG5cblx0YWRkRGF0YTogKHZhbHVlcykgLT5cblx0XHRpZiBUeXBlLmlzQXJyYXkodmFsdWVzKVxuXHRcdFx0cmVjb3JkcyA9IFtdXG5cdFx0XHRmb3IgZGF0YSBpbiB2YWx1ZXMgdGhlbiByZWNvcmRzLnB1c2goQGNyZWF0ZVJlY29yZChkYXRhKSlcblx0XHRcdEBhZGQocmVjb3Jkcylcblx0XHRlbHNlXG5cdFx0XHRAYWRkKEBjcmVhdGVSZWNvcmQodmFsdWVzKSlcblx0XHRyZXR1cm4gdGhpc1xuXG5cblx0Iy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblx0IyBEYXRhIHJlbW92aW5nXG5cblxuXHRyZW1vdmVCeTogKGNhbGxiYWNrKSAtPlxuXHRcdEByZW1vdmUoQGZpbmRBbGxCeShjYWxsYmFjaykpXG5cdFx0cmV0dXJuXG5cblxuXHRyZW1vdmVSZWNvcmQ6IChmaWVsZCwgdmFsdWUpIC0+XG5cdFx0QHJlbW92ZUJ5IChyZWMpIC0+XG5cdFx0XHRyZXR1cm4gcmVjLmdldChmaWVsZCkgaXMgdmFsdWVcblx0XHRyZXR1cm5cblxuXHRyZW1vdmVCeUlkOiAoaWQpIC0+XG5cdFx0QHJlbW92ZShAZ2V0QnlJZChpZCkpXG5cdFx0cmV0dXJuXG5cblxuXHRyZW1vdmVBdDogKGluZGV4LCBjb3VudCkgLT5cblx0XHRAcmVtb3ZlKEBmaW5kQWxsQXQoaW5kZXgsIGNvdW50KSlcblx0XHRyZXR1cm5cblxuXG5cdHJlbW92ZUFsbDogKHNpbGVudCkgLT5cblx0XHRpZiBAZGF0YS5sZW5ndGggPiAwXG5cdFx0XHRAY2xlYXIoKVxuXHRcdFx0QGVtaXQoXCJkYXRhY2hhbmdlZFwiLCB0aGlzKVxuXHRcdFx0QGVtaXQoXCJyZW1vdmVhbGxcIiwgdGhpcykgdW5sZXNzIHNpbGVudFxuXHRcdHJldHVyblxuXG5cblx0cmVtb3ZlOiAocmVjcykgLT5cblx0XHRjaGFuZ2VkID0gZmFsc2VcblxuXHRcdGZvciByZWMgaW4gQXJyYXkuZnJvbShyZWNzKVxuXHRcdFx0cmVjLnVuam9pblN0b3JlKHRoaXMpXG5cdFx0XHRpbmRleCA9IEBpbmRleE9mKHJlYylcblx0XHRcdEBkYXRhLmVyYXNlKHJlYylcblx0XHRcdEBuZXdSZWNvcmRzLmVyYXNlKHJlYylcblx0XHRcdEB1cGRhdGVkUmVjb3Jkcy5lcmFzZShyZWMpXG5cdFx0XHRAcmVtb3ZlZFJlY29yZHMuaW5jbHVkZShyZWMpXG5cdFx0XHRAZW1pdCgncmVtb3ZlJywgdGhpcywgcmVjLCBpbmRleClcblx0XHRcdGlmIEBmaWx0ZXJlZCBhbmQgQGdldEZpbHRlcnMoKS5tYXRjaChyZWMpIHRoZW4gQGZpbHRlcmVkRGF0YS5lcmFzZShyZWMpXG5cdFx0XHRjaGFuZ2VkID0gdHJ1ZVxuXG5cdFx0aWYgY2hhbmdlZFxuXHRcdFx0QGVtaXQoXCJkYXRhY2hhbmdlZFwiLCB0aGlzKVxuXHRcdHJldHVyblxuXG5cblx0Y2xlYXI6IC0+XG5cdFx0Zm9yIHJlYyBpbiBAZGF0YVxuXHRcdFx0cmVjLnVuam9pblN0b3JlKHRoaXMpXG5cdFx0aWYgQGZpbHRlcmVkXG5cdFx0XHRAZmlsdGVyZWREYXRhLmVtcHR5KClcblx0XHRAZGF0YS5lbXB0eSgpXG5cdFx0cmV0dXJuXG5cblxuXHQjLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXHQjIERhdGEgbG9hZGluZyBmcm9tIHByb3h5XG5cblxuXHRsb2FkOiAob3B0aW9ucyA9IHt9LCBkb25lID0gbnVsbCkgLT5cblx0XHRpZiAhQHByb3h5XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJDYW50IGxvYWQgZGF0YSwgcHJveHkgaXMgbWlzc2luZyBpbiBzdG9yZVwiKVxuXG5cdFx0aWYgb3B0aW9ucy5vbmNlICYmIEBsb2FkZWRcblx0XHRcdG1pd28uYXN5bmMgPT4gZG9uZSh0aGlzLCBAZGF0YSwgdHJ1ZSkgaWYgZG9uZVxuXHRcdFx0cmV0dXJuXG5cblx0XHRpZiBAbG9hZGluZ1xuXHRcdFx0cmV0dXJuXG5cblx0XHRvcHRpb25zLnBhcmFtcyA9IE9iamVjdC5tZXJnZSh7fSwgQHBhcmFtcywgb3B0aW9ucy5wYXJhbXMpXG5cdFx0b3B0aW9ucy5vZmZzZXQgPSAoaWYgKG9wdGlvbnMub2Zmc2V0IGlzbnQgYHVuZGVmaW5lZGApIHRoZW4gb3B0aW9ucy5vZmZzZXQgZWxzZSAoKGlmIG9wdGlvbnMucGFnZSB0aGVuIG9wdGlvbnMucGFnZSAtIDEgZWxzZSAwKSkgKiBAcGFnZVNpemUpXG5cdFx0b3B0aW9ucy5saW1pdCA9IG9wdGlvbnMubGltaXQgb3IgQHBhZ2VTaXplXG5cdFx0b3B0aW9ucy5maWx0ZXJzID0gaWYgQHN0b3JlRmlsdGVycyB0aGVuIEBzdG9yZUZpbHRlcnMuZ2V0QWxsKCkgZWxzZSBudWxsXG5cdFx0b3B0aW9ucy5zb3J0ZXJzID0gaWYgQHN0b3JlU29ydGVycyB0aGVuIEBzdG9yZVNvcnRlcnMuZ2V0QWxsKCkgZWxzZSBudWxsXG5cdFx0b3B0aW9ucy5hZGRSZWNvcmRzID0gb3B0aW9ucy5hZGRSZWNvcmRzIG9yIGZhbHNlXG5cdFx0b3B0aW9ucy5yZWNvcmRGYWN0b3J5ID0gQGJvdW5kKFwiY3JlYXRlUmVjb3JkXCIpXG5cblx0XHRAZW1pdChcImJlZm9yZWxvYWRcIiwgdGhpcywgb3B0aW9ucylcblx0XHRAbG9hZGluZyA9IHRydWVcblx0XHRAcGFnZSA9IChpZiBAcGFnZVNpemUgdGhlbiBNYXRoLm1heCgxLCBNYXRoLmNlaWwob3B0aW9ucy5vZmZzZXQgLyBAcGFnZVNpemUpICsgMSkgZWxzZSAxKVxuXG5cdFx0QHByb3h5LnJlYWQgb3B0aW9ucywgKG9wZXJhdGlvbikgPT5cblx0XHRcdHJlc3BvbnNlID0gb3BlcmF0aW9uLmdldFJlc3BvbnNlKClcblx0XHRcdHJlY29yZHMgPSBvcGVyYXRpb24uZ2V0UmVjb3JkcygpXG5cdFx0XHRzdWNjZXNzZnVsID0gb3BlcmF0aW9uLndhc1N1Y2Nlc3NmdWwoKVxuXHRcdFx0QGxvYWRSZWNvcmRzKHJlY29yZHMsIHRydWUpIGlmIHN1Y2Nlc3NmdWxcblx0XHRcdEB0b3RhbENvdW50ID0gcmVzcG9uc2UudG90YWwgaWYgcmVzcG9uc2Vcblx0XHRcdEBsb2FkaW5nID0gZmFsc2Vcblx0XHRcdEBsb2FkZWQgPSB0cnVlXG5cdFx0XHRAZW1pdChcImxvYWRcIiwgdGhpcywgcmVjb3Jkcywgc3VjY2Vzc2Z1bClcblx0XHRcdGRvbmUodGhpcywgcmVjb3Jkcywgc3VjY2Vzc2Z1bCkgaWYgZG9uZVxuXHRcdHJldHVyblxuXG5cblx0cmVsb2FkOiAoZG9uZSktPlxuXHRcdEBsb2FkKHtwYWdlOiBAcGFnZX0sIGRvbmUpXG5cdFx0cmV0dXJuXG5cblxuXHRsb2FkUGFnZTogKHBhZ2UsIGRvbmUpIC0+XG5cdFx0cmV0dXJuICB1bmxlc3MgQHBhZ2VTaXplXG5cdFx0QHBhZ2UgPSBNYXRoLm1heCgxLCBNYXRoLm1pbihwYWdlLCBNYXRoLmNlaWwoQHRvdGFsQ291bnQgLyBAcGFnZVNpemUpKSlcblx0XHRAbG9hZCh7cGFnZTogQHBhZ2V9LCBkb25lKVxuXHRcdHJldHVyblxuXG5cblx0bG9hZFByZXZQYWdlOiAoZG9uZSkgLT5cblx0XHRyZXR1cm4gIHVubGVzcyBAcGFnZVNpemVcblx0XHRAcGFnZSA9IE1hdGgubWF4KDEsIEBwYWdlIC0gMSlcblx0XHRAbG9hZCh7cGFnZTogQHBhZ2V9LCBkb25lKVxuXHRcdHJldHVyblxuXG5cblx0bG9hZE5leHRQYWdlOiAoZG9uZSkgLT5cblx0XHRyZXR1cm4gIHVubGVzcyBAcGFnZVNpemVcblx0XHRAcGFnZSA9IE1hdGgubWluKEBwYWdlICsgMSwgTWF0aC5jZWlsKEB0b3RhbENvdW50IC8gQHBhZ2VTaXplKSlcblx0XHRAbG9hZCh7cGFnZTogQHBhZ2V9LCBkb25lKVxuXHRcdHJldHVyblxuXG5cblx0bG9hZE5lc3RlZFBhZ2U6ICh0eXBlLCBkb25lKS0+XG5cdFx0aWYgdHlwZSBpcyAncHJldidcblx0XHRcdEBsb2FkUHJldlBhZ2UoZG9uZSlcblx0XHRlbHNlIGlmIHR5cGUgaXMgJ25leHQnXG5cdFx0XHRAbG9hZE5leHRQYWdlKGRvbmUpXG5cdFx0cmV0dXJuXG5cblxuXHQjLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXHQjIFN5bmNocm9uaXplXG5cblxuXHRyZXN1bWVBdXRvU3luYzogLT5cblx0XHRAYXV0b1N5bmNTdXNwZW5kZWQgPSB0cnVlXG5cdFx0cmV0dXJuXG5cblxuXHRzdXNwZW5kQXV0b1N5bmM6IC0+XG5cdFx0QGF1dG9TeW5jU3VzcGVuZGVkID0gZmFsc2Vcblx0XHRyZXR1cm5cblxuXG5cdCMgU3luYyBkYXRhIHdpdGggc2VydmVyXG5cdCMgQG9wdGlvbiBzdWNjZXNzIHtGdW5jdGlvbih0aGlzLCBvcCl9IFN1Y2Nlc3MgY2FsbGJhY2tcblx0IyBAb3B0aW9uIGVycm9yIHtGdW5jdGlvbih0aGlzLCBvcCl9IEVycm9yIGNhbGxiYWNrXG5cdCMgQHBhcmFtIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cblx0c3luYzogKG9wdGlvbnMgPSB7fSkgLT5cblx0XHRpZiAhQHByb3h5XG5cdFx0XHRyZXR1cm5cblxuXHRcdHRvQ3JlYXRlID0gQGdldE5ld1JlY29yZHMoKVxuXHRcdHRvVXBkYXRlID0gQGdldFVwZGF0ZWRSZWNvcmRzKClcblx0XHR0b0Rlc3Ryb3kgPSBAZ2V0UmVtb3ZlZFJlY29yZHMoKVxuXHRcdG9wZXJhdGlvbnMgPSB7fVxuXHRcdG5lZWRzU3luYyA9IGZhbHNlXG5cblx0XHRpZiB0b0NyZWF0ZS5sZW5ndGggPiAwXG5cdFx0XHRvcGVyYXRpb25zLmNyZWF0ZSA9XG5cdFx0XHRcdHJlY29yZHM6IHRvQ3JlYXRlXG5cdFx0XHRcdGNhbGxiYWNrOiBAY3JlYXRlUHJveHlDYWxsYmFjayhcIm9uUHJveHlDcmVhdGVDYWxsYmFja1wiLCBvcHRpb25zKVxuXHRcdFx0bmVlZHNTeW5jID0gdHJ1ZVxuXG5cdFx0aWYgdG9VcGRhdGUubGVuZ3RoID4gMFxuXHRcdFx0b3BlcmF0aW9ucy51cGRhdGUgPVxuXHRcdFx0XHRyZWNvcmRzOiB0b1VwZGF0ZVxuXHRcdFx0XHRjYWxsYmFjazogQGNyZWF0ZVByb3h5Q2FsbGJhY2soXCJvblByb3h5VXBkYXRlQ2FsbGJhY2tcIiwgb3B0aW9ucylcblx0XHRcdG5lZWRzU3luYyA9IHRydWVcblxuXHRcdGlmIHRvRGVzdHJveS5sZW5ndGggPiAwXG5cdFx0XHRvcGVyYXRpb25zLmRlc3Ryb3kgPVxuXHRcdFx0XHRyZWNvcmRzOiB0b0Rlc3Ryb3lcblx0XHRcdFx0Y2FsbGJhY2s6IEBjcmVhdGVQcm94eUNhbGxiYWNrKFwib25Qcm94eURlc3Ryb3lDYWxsYmFja1wiLCBvcHRpb25zKVxuXHRcdFx0bmVlZHNTeW5jID0gdHJ1ZVxuXG5cdFx0aWYgbmVlZHNTeW5jXG5cdFx0XHRvcGVyYXRpb25zLnByZXZlbnRTeW5jID0gZmFsc2Vcblx0XHRcdEBlbWl0KFwiYmVmb3Jlc3luY1wiLCBvcGVyYXRpb25zKVxuXHRcdFx0QHByb3h5LmV4ZWN1dGUob3BlcmF0aW9ucywge3JlY29yZEZhY3Rvcnk6IEBib3VuZChcImNyZWF0ZVJlY29yZFwiKX0pICBpZiAhb3BlcmF0aW9ucy5wcmV2ZW50U3luY1xuXHRcdGVsc2UgaWYgVHlwZS5pc0Z1bmN0aW9uKG9wdGlvbnMpXG5cdFx0XHQjIGNhbGwgY2FsbGJhY2sgYXN5bmNcblx0XHRcdG1pd28uYXN5bmMgKCk9PiBvcHRpb25zKClcblx0XHRyZXR1cm5cblxuXG5cdGNyZWF0ZVByb3h5Q2FsbGJhY2s6IChuYW1lLCBvcHRpb25zKSAtPlxuXHRcdHJldHVybiAob3ApID0+XG5cdFx0XHRAZW1pdChcInN5bmNcIiwgdGhpcywgb3ApXG5cdFx0XHRpZiBvcC53YXNTdWNjZXNzZnVsKClcblx0XHRcdFx0QGVtaXQoXCJzdWNjZXNzXCIsIHRoaXMsIG9wKVxuXHRcdFx0XHR0aGlzW25hbWVdKClcblx0XHRcdFx0aWYgVHlwZS5pc09iamVjdChvcHRpb25zKVxuXHRcdFx0XHRcdGlmIG9wdGlvbnMuc3VjY2VzcyB0aGVuIG9wdGlvbnMuc3VjY2Vzcyh0aGlzLCBvcClcblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdG9wdGlvbnModGhpcywgb3ApXG5cdFx0XHRlbHNlXG5cdFx0XHRcdEBlbWl0KFwiZmFpbHVyZVwiLCB0aGlzLCBvcClcblx0XHRcdFx0aWYgVHlwZS5pc09iamVjdChvcHRpb25zKVxuXHRcdFx0XHRcdGlmIG9wdGlvbnMuZmFpbHVyZSB0aGVuIG9wdGlvbnMuZmFpbHVyZSh0aGlzLCBvcClcblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdG9wdGlvbnModGhpcywgb3ApXG5cblxuXHRvblByb3h5Q3JlYXRlQ2FsbGJhY2s6IC0+XG5cdFx0QG5ld1JlY29yZHMuZW1wdHkoKVxuXHRcdEBvblByb3h5Q2FsbGJhY2soKVxuXHRcdEBlbWl0KFwiY3JlYXRlZFwiLCB0aGlzKVxuXHRcdHJldHVyblxuXG5cblx0b25Qcm94eVVwZGF0ZUNhbGxiYWNrOiAtPlxuXHRcdEB1cGRhdGVkUmVjb3Jkcy5lbXB0eSgpXG5cdFx0QG9uUHJveHlDYWxsYmFjaygpXG5cdFx0QGVtaXQoXCJ1cGRhdGVkXCIsIHRoaXMpXG5cdFx0cmV0dXJuXG5cblxuXHRvblByb3h5RGVzdHJveUNhbGxiYWNrOiAtPlxuXHRcdEByZW1vdmVkUmVjb3Jkcy5lbXB0eSgpXG5cdFx0QG9uUHJveHlDYWxsYmFjaygpXG5cdFx0QGVtaXQoXCJkZXN0cm95ZWRcIiwgdGhpcylcblx0XHRyZXR1cm5cblxuXG5cdG9uUHJveHlDYWxsYmFjazogLT5cblx0XHRAZW1pdChcInN5bmNlZFwiLCB0aGlzKVxuXHRcdEByZWxvYWQoKSAgaWYgQGF1dG9TeW5jUmVsb2FkXG5cdFx0cmV0dXJuXG5cblxuXHQjLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXHQjIFNvcnRpbmdcblxuXG5cdGdldFNvcnRlcnM6ICgpIC0+XG5cdFx0aWYgIUBzdG9yZVNvcnRlcnNcblx0XHRcdEBzdG9yZVNvcnRlcnMgPSBuZXcgU3RvcmVTb3J0ZXJzKHRoaXMpXG5cdFx0cmV0dXJuIEBzdG9yZVNvcnRlcnNcblxuXG5cdCMvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cdCMgRmlsdGVyaW5nXG5cblxuXHRnZXRGaWx0ZXJzOiAoKSAtPlxuXHRcdGlmICFAc3RvcmVGaWx0ZXJzXG5cdFx0XHRAc3RvcmVGaWx0ZXJzID0gbmV3IFN0b3JlRmlsdGVycyh0aGlzKVxuXHRcdHJldHVybiBAc3RvcmVGaWx0ZXJzXG5cblxuXG5cdCMvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cdCMgUmVjb3JkcyBoYW5kbGluZ1xuXG5cblx0YWZ0ZXJFZGl0OiAocmVjb3JkLCBtb2RpZmllZEZpZWxkTmFtZXMpIC0+XG5cdFx0QHVwZGF0ZWRSZWNvcmRzLmluY2x1ZGUocmVjb3JkKVxuXG5cdFx0aWYgQHByb3h5IGFuZCBAYXV0b1N5bmMgYW5kICFAYXV0b1N5bmNTdXNwZW5kZWRcblx0XHRcdGZvciBuYW1lIGluIG1vZGlmaWVkRmllbGROYW1lc1xuXHRcdFx0XHQjIG9ubHkgc3luYyBpZiBwZXJzaXN0ZW50IGZpZWxkcyB3ZXJlIG1vZGlmaWVkXG5cdFx0XHRcdGlmIHJlY29yZC5maWVsZHNbbmFtZV0ucGVyc2lzdFxuXHRcdFx0XHRcdHNob3VsZFN5bmMgPSB0cnVlXG5cdFx0XHRcdFx0YnJlYWtcblx0XHRcdGlmIHNob3VsZFN5bmNcblx0XHRcdFx0QHN5bmMoKVxuXG5cdFx0aWYgQHNvcnRPbkVkaXQgJiYgIUByZW1vdGVTb3J0ICYmIEBzdG9yZVNvcnRlcnMgJiYgQHN0b3JlU29ydGVycy5oYXMoKVxuXHRcdFx0QHN0b3JlU29ydGVycy5hcHBseSh0cnVlKSAjIHNpbGVudFxuXG5cdFx0aWYgQGZpbHRlck9uRWRpdCAmJiAhQHJlbW90ZUZpbHRlciAmJiBAc3RvcmVGaWx0ZXJzICYmIEBzdG9yZUZpbHRlcnMuaGFzKClcblx0XHRcdEBzdG9yZUZpbHRlcnMuYXBwbHkodHJ1ZSkgIyBzaWxlbnRcblxuXHRcdEBlbWl0KFwidXBkYXRlXCIsIHRoaXMsIHJlY29yZCwgXCJlZGl0XCIsIG1vZGlmaWVkRmllbGROYW1lcylcblx0XHRyZXR1cm5cblxuXG5cdGFmdGVyUmVqZWN0OiAocmVjb3JkKSAtPlxuXHRcdEB1cGRhdGVkUmVjb3Jkcy5lcmFzZShyZWNvcmQpXG5cdFx0QGVtaXQoXCJ1cGRhdGVcIiwgdGhpcywgcmVjb3JkLCBcInJlamVjdFwiLCBudWxsKVxuXHRcdHJldHVyblxuXG5cblx0YWZ0ZXJDb21taXQ6IChyZWNvcmQpIC0+XG5cdFx0QHVwZGF0ZWRSZWNvcmRzLmVyYXNlKHJlY29yZClcblx0XHRAZW1pdChcInVwZGF0ZVwiLCB0aGlzLCByZWNvcmQsIFwiY29tbWl0XCIsIG51bGwpXG5cdFx0cmV0dXJuXG5cblxubW9kdWxlLmV4cG9ydHMgPSBTdG9yZSIsIkZpbHRlciA9IHJlcXVpcmUgJy4vRmlsdGVyJ1xuXG5cbmNsYXNzIFN0b3JlRmlsdGVyc1xuXG5cdGZpbHRlcnM6IG51bGxcblx0c3RvcmU6IG51bGxcblxuXG5cdGNvbnN0cnVjdG9yOiAoQHN0b3JlKSAtPlxuXHRcdEBmaWx0ZXJzID0gW11cblx0XHRyZXR1cm5cblxuXG5cdGdldEFsbDogLT5cblx0XHRyZXR1cm4gQGZpbHRlcnNcblxuXG5cdGNsZWFyOiAtPlxuXHRcdEBmaWx0ZXJzLmVtcHR5KClcblx0XHRyZXR1cm5cblxuXG5cdGFwcGVuZDogKGZpbHRlcikgLT5cblx0XHRAZmlsdGVycy5wdXNoKGZpbHRlcilcblx0XHRyZXR1cm5cblxuXG5cdGhhczogLT5cblx0XHRyZXR1cm4gQGZpbHRlcnMubGVuZ3RoID4gMFxuXG5cblx0YWRkOiAobmFtZSwgdmFsdWUsIHR5cGUsIG9wZXJhdGlvbiwgcGFyYW1zKSAtPlxuXHRcdGlmIFR5cGUuaXNBcnJheShuYW1lKVxuXHRcdFx0Zm9yIGZpbHRlciBpbiBuYW1lXG5cdFx0XHRcdEBhZGQoZmlsdGVyKVxuXHRcdGVsc2Vcblx0XHRcdGlmIFR5cGUuaXNJbnN0YW5jZShuYW1lKVxuXHRcdFx0XHRAYXBwZW5kKG5hbWUpXG5cdFx0XHRlbHNlIGlmIFR5cGUuaXNPYmplY3QobmFtZSlcblx0XHRcdFx0QGFwcGVuZChuZXcgRmlsdGVyKG5hbWUpKVxuXHRcdFx0ZWxzZVxuXHRcdFx0XHRAYXBwZW5kKG5ldyBGaWx0ZXIoe25hbWU6IG5hbWUsIHZhbHVlOiB2YWx1ZSwgdHlwZTogdHlwZSwgb3BlcmF0aW9uOiBvcGVyYXRpb24sIHBhcmFtczogcGFyYW1zfSkpXG5cdFx0cmV0dXJuIHRoaXNcblxuXG5cdGZpbHRlcjogKG5hbWUsIHZhbHVlLCB0eXBlLCBvcGVyYXRpb24sIHBhcmFtcykgLT5cblx0XHRAY2xlYXIoKVxuXHRcdEBhZGQobmFtZSwgdmFsdWUsIHR5cGUsIG9wZXJhdGlvbiwgcGFyYW1zKSBpZiBuYW1lXG5cdFx0QGFwcGx5KClcblx0XHRyZXR1cm4gdGhpc1xuXG5cblx0YXBwbHk6IChzaWxlbnQpIC0+XG5cdFx0aWYgQHN0b3JlLnJlbW90ZUZpbHRlclxuXHRcdFx0QHN0b3JlLmxvYWQoKVxuXHRcdGVsc2Vcblx0XHRcdEBzdG9yZS5maWx0ZXJlZCA9IEBmaWx0ZXJzLmxlbmd0aCA+IDBcblx0XHRcdEBzdG9yZS5maWx0ZXJlZERhdGEgPSBbXVxuXHRcdFx0Zm9yIHJlYyBpbiBAc3RvcmUuZGF0YVxuXHRcdFx0XHRpZiBAbWF0Y2gocmVjKVxuXHRcdFx0XHRcdEBzdG9yZS5maWx0ZXJlZERhdGEucHVzaChyZWMpXG5cdFx0XHRpZiAhc2lsZW50XG5cdFx0XHRcdEBzdG9yZS5lbWl0KFwicmVmcmVzaFwiLCBAc3RvcmUpXG5cblx0XHRAc3RvcmUuZW1pdChcImZpbHRlclwiLCBAc3RvcmUsIEBmaWx0ZXJzKVxuXHRcdHJldHVybiB0aGlzXG5cblxuXHRtYXRjaDogKHJlY29yZCkgLT5cblx0XHRmb3IgZmlsdGVyIGluIEBmaWx0ZXJzXG5cdFx0XHRpZiBmaWx0ZXIubWF0Y2gocmVjb3JkKSBpcyBmYWxzZVxuXHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRyZXR1cm4gdHJ1ZVxuXG5cbm1vZHVsZS5leHBvcnRzID0gU3RvcmVGaWx0ZXJzIiwiQmFzZU1hbmFnZXIgPSByZXF1aXJlICcuL0Jhc2VNYW5hZ2VyJ1xuU3RvcmUgPSByZXF1aXJlICcuL1N0b3JlJ1xuXG5jbGFzcyBTdG9yZU1hbmFnZXIgZXh0ZW5kcyBCYXNlTWFuYWdlclxuXG5cblx0Y3JlYXRlOiAobmFtZSkgLT5cblx0XHRzdG9yZSA9IHN1cGVyKG5hbWUpXG5cdFx0aWYgIXN0b3JlLmlzU3RvcmVcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIkNyZWF0ZWQgc3RvcmUgaXMgbm90IGluc3RhbmNlIG9mIE1pd28uZGF0YS5TdG9yZVwiKVxuXHRcdGlmICFzdG9yZS5uYW1lXG5cdFx0XHRzdG9yZS5uYW1lID0gbmFtZVxuXHRcdHJldHVybiBzdG9yZVxuXG5cbm1vZHVsZS5leHBvcnRzID0gU3RvcmVNYW5hZ2VyIiwiU29ydGVyID0gcmVxdWlyZSAnLi9Tb3J0ZXInXG5cblxuY2xhc3MgU3RvcmVTb3J0ZXJzXG5cblx0c29ydGVyczogbnVsbFxuXHRzdG9yZTogbnVsbFxuXG5cblx0Y29uc3RydWN0b3I6IChAc3RvcmUpIC0+XG5cdFx0QHNvcnRlcnMgPSBbXVxuXHRcdEBjb21wYXJhdG9yID0gQGNyZWF0ZUNvbXBhcmF0b3IodGhpcylcblx0XHRyZXR1cm5cblxuXG5cdGNsZWFyOiAtPlxuXHRcdEBzb3J0ZXJzLmVtcHR5KClcblx0XHRyZXR1cm4gdGhpc1xuXG5cblx0aGFzOiAtPlxuXHRcdHJldHVybiBAc29ydGVycy5sZW5ndGggPiAwXG5cblxuXHRnZXRBbGw6IC0+XG5cdFx0cmV0dXJuIEBzb3J0ZXJzXG5cblxuXHRzZXQ6IChuYW1lLCBkaXIpIC0+XG5cdFx0aWYgVHlwZS5pc09iamVjdChuYW1lKVxuXHRcdFx0Zm9yIG4sZCBvZiBuYW1lIHRoZW4gQHNldChuLCBkKVxuXHRcdGVsc2Vcblx0XHRcdEBzb3J0ZXJzLnB1c2gobmV3IFNvcnRlcih7bmFtZTpuYW1lLCBkaXI6ZGlyfSkpXG5cdFx0cmV0dXJuIHRoaXNcblxuXG5cdHNvcnQ6IChuYW1lLCBkaXIpIC0+XG5cdFx0QGNsZWFyKClcblx0XHRAc2V0KG5hbWUsIGRpcikgaWYgbmFtZVxuXHRcdEBhcHBseSgpXG5cdFx0cmV0dXJuIHRoaXNcblxuXG5cdGFwcGx5OiAoc2lsZW50KSAtPlxuXHRcdHN0b3JlID0gQHN0b3JlXG5cdFx0c29ydGVycyA9IEBzb3J0ZXJzXG5cdFx0Y29tcGFyYXRvciA9IEBjb21wYXJhdG9yXG5cblx0XHRpZiBzdG9yZS5yZW1vdGVTb3J0XG5cdFx0XHRzdG9yZS5sb2FkKClcblx0XHRlbHNlXG5cdFx0XHRzdG9yZS5zb3J0ZWQgPSBzb3J0ZXJzLmxlbmd0aCA+IDBcblx0XHRcdHN0b3JlLmRhdGEuc29ydChjb21wYXJhdG9yKVxuXHRcdFx0c3RvcmUuZmlsdGVyZWREYXRhLnNvcnQoY29tcGFyYXRvcikgIGlmIHN0b3JlLmZpbHRlcmVkRGF0YVxuXHRcdFx0c3RvcmUuZW1pdChcInJlZnJlc2hcIiwgc3RvcmUpICBpZiAhc2lsZW50XG5cdFx0c3RvcmUuZW1pdChcInNvcnRcIiwgc3RvcmUsIHNvcnRlcnMpXG5cdFx0cmV0dXJuIHRoaXNcblxuXG5cdGdldEluc2VydGlvbkluZGV4OiAocmVjb3JkLCBjb21wYXJlKSAtPlxuXHRcdGluZGV4ID0gMFxuXHRcdGZvciByZWMsaW5kZXggaW4gQHN0b3JlLmRhdGFcblx0XHRcdGlmIGNvbXBhcmUocmVjLCByZWNvcmQpID4gMFxuXHRcdFx0XHRyZXR1cm4gaW5kZXhcblx0XHRyZXR1cm4gaW5kZXhcblxuXG5cdGdldEluZGV4OiAocmVjKSAtPlxuXHRcdHJldHVybiBAZ2V0SW5zZXJ0aW9uSW5kZXgocmVjLCBAY29tcGFyYXRvcilcblxuXG5cdGNyZWF0ZUNvbXBhcmF0b3I6IChtZSktPlxuXHRcdHJldHVybiAoYSwgYikgLT5cblx0XHRcdGlmICFtZS5zb3J0ZXJzXG5cdFx0XHRcdHJldHVyblxuXHRcdFx0Zm9yIHNvcnRlciBpbiBtZS5zb3J0ZXJzXG5cdFx0XHRcdHJldCA9IHNvcnRlci5jb21wYXJlKGEsIGIpXG5cdFx0XHRcdGlmIHJldCBpcyAtMSBvciByZXQgaXMgMVxuXHRcdFx0XHRcdHJldHVybiByZXRcblx0XHRcdHJldHVyblxuXG5cbm1vZHVsZS5leHBvcnRzID0gU3RvcmVTb3J0ZXJzIiwiVHlwZXMgPVxuXG5cdHN0cmlwUmU6IC9bXFwkLCVdL2dcblxuXHQjIEBwcm9wZXJ0eSB7T2JqZWN0fSBTVFJJTkdcblx0IyBUaGlzIGRhdGEgdHlwZSBtZWFucyB0aGF0IHRoZSByYXcgZGF0YSBpcyBjb252ZXJ0ZWQgaW50byBhIFN0cmluZyBiZWZvcmUgaXQgaXMgcGxhY2VkIGludG8gYSBSZWNvcmQuXG5cdHN0cmluZzpcblx0XHR0eXBlOiBcInN0cmluZ1wiXG5cdFx0Y29udmVydDogKHYpIC0+XG5cdFx0XHRkZWZhdWx0VmFsdWUgPSAoaWYgQG51bGxhYmxlIHRoZW4gbnVsbCBlbHNlIFwiXCIpXG5cdFx0XHRyZXR1cm4gKGlmICh2IGlzIGB1bmRlZmluZWRgIG9yIHYgaXMgbnVsbCkgdGhlbiBkZWZhdWx0VmFsdWUgZWxzZSBTdHJpbmcodikpXG5cblxuXHQjIEBwcm9wZXJ0eSB7T2JqZWN0fSBJTlRcblx0IyBUaGlzIGRhdGEgdHlwZSBtZWFucyB0aGF0IHRoZSByYXcgZGF0YSBpcyBjb252ZXJ0ZWQgaW50byBhbiBpbnRlZ2VyIGJlZm9yZSBpdCBpcyBwbGFjZWQgaW50byBhIFJlY29yZC5cblx0aW50OlxuXHRcdHR5cGU6IFwiaW50XCJcblx0XHRjb252ZXJ0OiAodikgLT5cblx0XHRcdHJldHVybiAoaWYgdiBpc250IGB1bmRlZmluZWRgIGFuZCB2IGlzbnQgbnVsbCBhbmQgdiBpc250IFwiXCIgdGhlbiBwYXJzZUludChTdHJpbmcodikucmVwbGFjZShUeXBlcy5zdHJpcFJlLCBcIlwiKSwgMTApIGVsc2UgKChpZiBAbnVsbGFibGUgdGhlbiBudWxsIGVsc2UgMCkpKVxuXG5cblx0IyBAcHJvcGVydHkge09iamVjdH0gRkxPQVRcblx0IyBUaGlzIGRhdGEgdHlwZSBtZWFucyB0aGF0IHRoZSByYXcgZGF0YSBpcyBjb252ZXJ0ZWQgaW50byBhIG51bWJlciBiZWZvcmUgaXQgaXMgcGxhY2VkIGludG8gYSBSZWNvcmQuXG5cdGZsb2F0OlxuXHRcdHR5cGU6IFwiZmxvYXRcIlxuXHRcdGNvbnZlcnQ6ICh2KSAtPlxuXHRcdFx0cmV0dXJuIChpZiB2IGlzbnQgYHVuZGVmaW5lZGAgYW5kIHYgaXNudCBudWxsIGFuZCB2IGlzbnQgXCJcIiB0aGVuIHBhcnNlRmxvYXQoU3RyaW5nKHYpLnJlcGxhY2UoVHlwZXMuc3RyaXBSZSwgXCJcIiksIDEwKSBlbHNlICgoaWYgQG51bGxhYmxlIHRoZW4gbnVsbCBlbHNlIDApKSlcblxuXG5cdCMgQHByb3BlcnR5IHtPYmplY3R9IEJPT0xFQU5cblx0IyA8cD5UaGlzIGRhdGEgdHlwZSBtZWFucyB0aGF0IHRoZSByYXcgZGF0YSBpcyBjb252ZXJ0ZWQgaW50byBhIGJvb2xlYW4gYmVmb3JlIGl0IGlzIHBsYWNlZCBpbnRvXG5cdCMgYSBSZWNvcmQuIFRoZSBzdHJpbmcgXCJ0cnVlXCIgYW5kIHRoZSBudW1iZXIgMSBhcmUgY29udmVydGVkIHRvIGJvb2xlYW4gPGNvZGU+dHJ1ZTwvY29kZT4uPC9wPlxuXHRib29sZWFuOlxuXHRcdHR5cGU6IFwiYm9vbGVhblwiXG5cdFx0Y29udmVydDogKHYpIC0+XG5cdFx0XHRpZiBAbnVsbGFibGUgYW5kICh2IGlzIGB1bmRlZmluZWRgIG9yIHYgaXMgbnVsbCBvciB2IGlzIFwiXCIpXG5cdFx0XHRcdHJldHVybiBudWxsXG5cdFx0XHRyZXR1cm4gdiBpcyB0cnVlIG9yIHYgaXMgXCJ0cnVlXCIgb3IgdiBpcyAxXG5cblxuXHQjIEBwcm9wZXJ0eSB7T2JqZWN0fSBEQVRFXG5cdCMgVGhpcyBkYXRhIHR5cGUgbWVhbnMgdGhhdCB0aGUgcmF3IGRhdGEgaXMgY29udmVydGVkIGludG8gYSBEYXRlIGJlZm9yZSBpdCBpcyBwbGFjZWQgaW50byBhIFJlY29yZC5cblx0ZGF0ZTpcblx0XHR0eXBlOiBcImRhdGVcIlxuXHRcdGNvbnZlcnQ6ICh2KSAtPlxuXHRcdFx0cGFyc2VkID0gdW5kZWZpbmVkXG5cdFx0XHRyZXR1cm4gbnVsbCAgaWYgIXZcblx0XHRcdHJldHVybiB2ICBpZiBUeXBlLmlzRGF0ZSh2KVxuXHRcdFx0cGFyc2VkID0gRGF0ZS5wYXJzZSh2KVxuXHRcdFx0cmV0dXJuIChpZiBwYXJzZWQgdGhlbiBuZXcgRGF0ZShwYXJzZWQpIGVsc2UgbnVsbClcblxuXG5cdGpzb246XG5cdFx0dHlwZTogXCJqc29uXCJcblx0XHRjb252ZXJ0OiAodikgLT5cblx0XHRcdGlmICF2XG5cdFx0XHRcdHJldHVybiB7fVxuXHRcdFx0ZWxzZSBpZiBUeXBlLmlzU3RyaW5nKHYpXG5cdFx0XHRcdHJldHVybiAgSlNPTi5kZWNvZGUodilcblx0XHRcdGVsc2Vcblx0XHRcdFx0cmV0dXJuIHZcblxuXHRhcnJheTpcblx0XHR0eXBlOiBcImFycmF5XCJcblx0XHRjb252ZXJ0OiAodikgLT5cblx0XHRcdGlmICF2XG5cdFx0XHRcdHJldHVybiBudWxsXG5cdFx0XHRlbHNlIGlmIFR5cGUuaXNBcnJheSh2KVxuXHRcdFx0XHRyZXR1cm4gdlxuXHRcdFx0ZWxzZSBpZiBUeXBlLmlzU3RyaW5nKHYpXG5cdFx0XHRcdHJldHVybiB2LnNwbGl0IFwiO1wiXG5cdFx0XHRlbHNlXG5cdFx0XHRcdHJldHVybiBBcnJheS5mcm9tKHYpXG5cblxubW9kdWxlLmV4cG9ydHMgPSBUeXBlcyIsIk1pd28uZGF0YSA9XG5cdFJlY29yZDogcmVxdWlyZSAnLi9SZWNvcmQnXG5cdEVudGl0eTogcmVxdWlyZSAnLi9FbnRpdHknXG5cdFByb3h5OiByZXF1aXJlICcuL1Byb3h5J1xuXHRTdG9yZTogcmVxdWlyZSAnLi9TdG9yZSdcblx0VHlwZXM6IHJlcXVpcmUgJy4vVHlwZXMnXG5cdEZpbHRlcjogcmVxdWlyZSAnLi9GaWx0ZXInXG5cdFNvcnRlcjogcmVxdWlyZSAnLi9Tb3J0ZXInXG5cblxuTWl3by5TdG9yZSA9IE1pd28uZGF0YS5TdG9yZVxuTWl3by5SZWNvcmQgPSBNaXdvLmRhdGEuUmVjb3JkXG5NaXdvLkVudGl0eSA9IE1pd28uZGF0YS5FbnRpdHlcbk1pd28uUHJveHkgPSBNaXdvLmRhdGEuUHJveHlcblxuXG5taXdvLnJlZ2lzdGVyRXh0ZW5zaW9uKCdtaXdvLWRhdGEnLCByZXF1aXJlICcuL0RpRXh0ZW5zaW9uJykiXX0=
