var Package = require('./package');
var Crypto = require('crypto');
var Hoek = require('hoek');
var Boom = require('boom');
var Joi = require('joi');


var internals = {};


internals.getOptions = function (options) {

    var defaults = {
        encoding: 'base64',
        algo: 'sha1',
        varieties: ['plain', 'buffer'],
        etagOptions: {} 
    };

    options = Hoek.applyToDefaults(defaults, options);

    var schema = {
        encoding: Joi.string().required().valid(['hex', 'base64']),
        algo: Joi.string().required().valid(Crypto.getHashes()),
        varieties: Joi.array().required().items(Joi.string().valid(['plain', 'buffer', 'view', 'stream'])),
        etagOptions: Joi.object().required()
    };

    Joi.assert(options, schema);

    return options;
};


internals.marshal = function (request, next) {

    var options = request.server.plugins[Package.name].options;
    var response = request.response;
    var source = response.source;

    switch (response.variety) {
        case 'plain':
            if (typeof source === 'object') {
                return next(null, JSON.stringify(source));
            }
            // Should we allow numbers?
            if (typeof source !== 'string') {
                return next(Boom.badImplementation('Plain variety responses must be objects or strings'));
            }
            return next(null, source);
        break;
        case 'buffer':
            return next(null, source);
        break;
        case 'view':
            return request.render(source.template, source.context, source.options, function (err, rendered) {

                if (err) {
                    throw err;
                }

                return next(null, rendered);
            });
        break;
        case 'stream':
            // We have to read all of the data off the stream to calculate the ETag

            var pass = new (require('stream').PassThrough);
            var data = new Buffer('');

            source.on('data', function (d) {
                pass.push(d);
                data = Buffer.concat([data, d]);
                
            });

            source.on('end', function () {
                pass.push(null);
                request.response.source = pass;
                next(null, data);
            });
        break;
        default:
            next(Boom.badImplementation('Unknown variety'));
        break;
    }
};


internals.onPreResponse = function (request, reply) {

    var options = request.server.plugins[Package.name].options;
    var response = request.response;

    if (options.varieties.indexOf(response.variety) === -1) {
        return reply.continue();
    }

    internals.marshal(request, function (err, contents) {

        if (err) {
            throw err;
        }

        var hash = Crypto.createHash(options.algo);
        hash.update(contents);
        response.etag(hash.digest(options.encoding), options.etagOptions);

        reply.continue();
    });
};


exports.register = function (server, options, next) {

    server.plugins[Package.name] = server.plugins[Package.name] || {};
    server.plugins[Package.name].options = internals.getOptions(options);
    server.ext('onPreResponse', internals.onPreResponse);
    next();
};


exports.register.attributes = {
    name: Package.name,
    version: Package.version
};
