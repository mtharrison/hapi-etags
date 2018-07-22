const Hapi = require('hapi');

const server = new Hapi.Server({
  port: 4000
});

server.register({
  plugin: require('vision')
}).then(() => {
  server.views({
    engines   : {
      hbs: require('handlebars')
    },
    relativeTo: __dirname
  });
});

server.route([
  {
    method : 'GET',
    path   : '/object',
    handler: function (request, h) {

      const users = [
        {
          gender  : 'female',
          name    : {
            title: 'ms',
            first: 'manuela',
            last : 'velasco'
          },
          location: {
            street: '1969 calle de alberto aguilera',
            city  : 'la coruña',
            state : 'asturias',
            zip   : '56298'
          }
        }
      ];

      return users;
    },
    config : {
      cache: {
        privacy  : 'private',
        expiresIn: 86400 * 1000
      }
    }
  }, {
    method : 'GET',
    path   : '/string',
    handler: function (request, h) {

      return 'This is a string';
    },
    config : {
      cache: {
        privacy  : 'private',
        expiresIn: 86400 * 1000
      }
    }
  }, {
    method : 'GET',
    path   : '/number',
    handler: function (request, h) {

      return 42;
    },
    config : {
      cache: {
        privacy  : 'private',
        expiresIn: 86400 * 1000
      }
    }
  }, {
    method : 'GET',
    path   : '/buffer',
    handler: function (request, h) {
      const buf = Buffer.from('I am a buffer!');
      return h.response(buf).bytes(buf.length).code(200);
    },
    config : {
      cache: {
        privacy  : 'private',
        expiresIn: 86400 * 1000
      }
    }
  }, {
    method : 'GET',
    path   : '/view',
    handler: function (request, h) {

      return h.view('index', { data: 'something' });
    },
    config : {
      cache: {
        privacy  : 'private',
        expiresIn: 86400 * 1000
      }
    }
  }, {
    method : 'GET',
    path   : '/stream',
    handler: function (request, h) {

      const stream = new (require('stream').Readable);

      let i = 0;

      stream._read = function () {

        const self = this;

        if (i === 20) {
          return this.push(null);
        }

        setTimeout(function () {
          self.push(i.toString());
          i++
        }, 100);
      };

      return h
        .response(stream)
        .header('content-type', 'text/html');
    },
    config : {
      cache: {
        privacy  : 'private',
        expiresIn: 86400 * 1000
      }
    }
  }
]);

try {
  server
    .register({
      plugin : require('..'),
      options: {
        encoding : 'hex',
        algo     : 'md5',
        varieties: ['plain', 'buffer', 'view', 'stream']
      }
    })
    .then(() => {
      server.start().then(() => {
        console.log('Started!');
      });
    });
} catch (err) {
  throw err;
}

