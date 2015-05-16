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
        varieties: ['plain', 'buffer', 'view'],
        etagOptions: {} 
    };

    options = Hoek.applyToDefaults(defaults, options);

    var schema = {
        encoding: Joi.string().required().valid(['hex', 'base64']),
        algo: Joi.string().required().valid(Crypto.getHashes()),
        varieties: Joi.array().required().items(['plain', 'buffer', 'view']),
        etagOptions: Joi.object().required()
    };

    Joi.assert(options, schema);

    return options;
};


internals.onPreResponse = function (request, reply) {

    var options = request.server.plugins[Package.name].options;
    var response = request.response;
    var wait = false;
    var contents;

    var setEtag = function (contents) {

        var hash = Crypto.createHash(options.algo);
        hash.update(contents);
        response.etag(hash.digest(options.encoding), options.etagOptions);

        reply.continue();
    };

    if (options.varieties.indexOf(response.variety) > -1) {

        var source = response.source;

        switch (response.variety) {
            case 'plain':
                if (typeof source === 'object') {
                    return setEtag(JSON.stringify(source));
                }
                if (typeof source !== 'string') {
                    return reply(Boom.badImplementation('Plain variety responses must be objects or strings'));
                }
                return setEtag(source);
            break;
            case 'buffer':
                return setEtag(source);
            break;
            case 'view':

                return request.server.render(source.template, source.context, function (err, rendered) {

                    if (err) {
                        throw err;
                    }

                    return setEtag(rendered);
                });
            break;
        }
    }

    reply.continue();
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
}