const Package = require('./package');
const Crypto = require('crypto');
const Hoek = require('hoek');
const Boom = require('boom');
const Joi = require('joi');


const internals = {};


internals.getOptions = function (options) {

  const defaults = {
    encoding: 'base64',
    algo: 'sha1',
    varieties: ['plain', 'buffer'],
    etagOptions: {}
  };

  options = Hoek.applyToDefaults(defaults, options);

  const schema = {
    encoding: Joi.string().required().valid(['hex', 'base64']),
    algo: Joi.string().required().valid(Crypto.getHashes()),
    varieties: Joi.array().required().items(Joi.string().valid(['plain', 'buffer', 'view', 'stream'])),
    etagOptions: Joi.object().required()
  };

  Joi.assert(options, schema);

  return options;
};


internals.marshal = async (request) => {

  const response = request.response;
  const source = response.source;

  switch (response.variety) {
    case 'plain':
      if (typeof source === 'object') {
        return JSON.stringify(source);
      }
      // Should we allow numbers?
      if (typeof source !== 'string') {
        throw Boom.badImplementation('Plain variety responses must be objects or strings');
      }
      return source;
      break;
    case 'buffer':
      return source;
      break;
    case 'view':
      return request.server.render(source.template, source.context, function (err, rendered) {

        if (err) {
          throw err;
        }

        return rendered;
      });
      break;
    case 'stream':
      // We have to read all of the data off the stream to calculate the ETag

      const pass = new (require('stream').PassThrough);
      let   data = new Buffer('');

      source.on('data', function (d) {
        pass.push(d);
        data = Buffer.concat([data, d]);

      });

      source.on('end', function () {
        pass.push(null);
        request.response.source = pass;
        return data;
      });
      break;
    default:
      throw Boom.badImplementation('Unknown variety');
      break;
  }
};


internals.onPreResponse = async (request, h) => {

  const options = request.server.plugins[Package.name].options;
  const response = request.response;

  if (options.varieties.indexOf(response.variety) === -1) {
    return h.continue;
  }

  try {
    const contents = await internals.marshal(request);
    const hash = Crypto.createHash(options.algo);
    hash.update(contents);
    response.etag(hash.digest(options.encoding), options.etagOptions);
    return h.continue;
  }  catch (err) {
    return err;
  }
};

exports.plugin = {
  register: (server, options) => {
    server.plugins[Package.name]         = server.plugins[Package.name] || {};
    server.plugins[Package.name].options = internals.getOptions(options);
    server.ext('onPreResponse', internals.onPreResponse);
  },
  name    : Package.name,
  version : Package.version
};