# hapi-etags
---

hapi will automatically generate ETag headers for your responses when you use the file handler or `reply.file()` method. But if you're using any other kind of response (such as JSON, HTML, text etc) you won't get ETags for free. This plugin fixes that!

## Installation and configuration

To install, just add to your npm dependencies:

```shell
npm install --save hapi-etags
```
	
Then register the plugin:

```javascript
server.register([
    {
	register: require('hapi-etags'),
	options: {
			// explained below
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
```

The following options are available when registering the plugin [defaults]:

* `algo` - The hashing function to use to calculate the ETag. Can be anything in `Crypto.getHashes()` Default: `sha1`
* `encoding` - The encoding to use for the ETag hash. Can be base64 or hex. Default: `'base64'`
* `varieties` - A list of the variety types that the plugin will calculate etags for. Options are `['plain', 'buffer', 'view', 'stream']`. Default: `['plain', 'buffer']`
* `etagOptions` - The same options argument that's passed to `response.etag` (http://hapijs.com/api#response-object-redirect-methods). Default: `{}`

## Advice and warnings

Only the `plain` and `buffer` varieties are set by default. Support for the other varieties should be considered experimental. Here's some issues to be aware of:

* `view` - Has to pre-render the view template to calculate the ETag so a performance hit will be taken.
* `stream` - Has to read and buffer the entire stream data into memory to calculate the ETag. Clients could be waiting while this happens. Could totally break the responsiveness of your app - beware! Only makes sense to use this when your clients have bandwidth limitations and you're willing to go to extreme lengths to prevent them redownloading streamed content.
