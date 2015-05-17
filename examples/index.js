var Hapi = require('hapi');

var server = new Hapi.Server();
server.connection({ port: 4000 });

server.views({
    engines: {
        hbs: require('handlebars')
    },
    relativeTo: __dirname
});

server.route([
    {
        method: 'GET',
        path: '/object',
        handler: function (request, reply) {

            var users = [
                {
                    gender: 'female',
                    name: {
                        title: 'ms',
                        first: 'manuela',
                        last: 'velasco'
                    },
                    location: {
                        street: '1969 calle de alberto aguilera',
                        city: 'la coruña',
                        state: 'asturias',
                        zip: '56298'
                    }
                }
            ];

            reply(users);
        },
        config: {
            cache: {
                privacy: 'private',
                expiresIn: 86400 * 1000
            }
        }
    }, {
        method: 'GET',
        path: '/string',
        handler: function (request, reply) {

            reply('This is a string');
        },
        config: {
            cache: {
                privacy: 'private',
                expiresIn: 86400 * 1000
            }
        }
    }, {
        method: 'GET',
        path: '/number',
        handler: function (request, reply) {

            reply(42);
        },
        config: {
            cache: {
                privacy: 'private',
                expiresIn: 86400 * 1000
            }
        }
    }, {
        method: 'GET',
        path: '/buffer',
        handler: function (request, reply) {

            reply(new Buffer('I am a buffer!'));
        },
        config: {
            cache: {
                privacy: 'private',
                expiresIn: 86400 * 1000
            }
        }
    }, {
        method: 'GET',
        path: '/view',
        handler: function (request, reply) {

            reply.view('index', {data: 'somethins'});
        },
        config: {
            cache: {
                privacy: 'private',
                expiresIn: 86400 * 1000
            }
        }
    }, {
        method: 'GET',
        path: '/stream',
        handler: function (request, reply) {

            var stream = new (require('stream').Readable);

            var i = 0;

            stream._read = function () {

                var self = this;

                if (i === 20) {
                    return this.push(null);
                }

                setTimeout(function (){
                    self.push(i.toString());
                    i++
                }, 100);
            };

            var res = reply(stream);

            res.header('content-type', 'text/html');
        },
        config: {
            cache: {
                privacy: 'private',
                expiresIn: 86400 * 1000
            }
        }
    }
]);

server.register([
    {
        register: require('..'),
        options: {
            encoding: 'hex',
            algo: 'md5',
            varieties: ['plain', 'buffer', 'view', 'stream']
        }
    }
], function (err) {

    if (err) {
        throw err;
    }

    server.start(function () {
        console.log('Started!');
    });

});