# Stream Consumers

*`node:stream/consumers` for Deno, Browsers and older nodejs versions*

(targeting NodeJS v16.7.0+ only? use [node:stream/consumers](https://nodejs.org/api/webstreams.html#webstreams_utility_consumers) instead)


## Install
This package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c):
Node 12.20+ is needed to use it and it must be `import`ed instead of `require`d.<br>
`npm install stream-consumers`

## Use

The utility consumer functions provide common options for consuming
streams.

They are accessed using:

```js
import { arrayBuffer, blob, json, text, buffer } from 'stream-consumers'
```

#### `streamConsumers.arrayBuffer(stream)`

* `stream` {ReadableStream|stream.Readable|AsyncIterator}
* Returns: {Promise} Fulfills with an `ArrayBuffer` containing the full
  contents of the stream.

#### `streamConsumers.blob(stream)`

* `stream` {ReadableStream|stream.Readable|AsyncIterator}
* Returns: {Promise} Fulfills with a {Blob} containing the full contents
  of the stream.

#### `streamConsumers.json(stream)`

* `stream` {ReadableStream|stream.Readable|AsyncIterator}
* Returns: {Promise} Fulfills with the contents of the stream parsed as a
  UTF-8 encoded string that is then passed through `JSON.parse()`.

#### `streamConsumers.text(stream)`

* `stream` {ReadableStream|stream.Readable|AsyncIterator}
* Returns: {Promise} Fulfills with the contents of the stream parsed as a
  UTF-8 encoded string.

#### `streamConsumers.buffer(stream)`

* NodeJS only feature. Best avoided for better cross comparability with Deno And Browsers. Use arrayBuffer() instead.
* `stream` {ReadableStream|stream.Readable|AsyncIterator}
* Returns: {Promise} Fulfills with a {Buffer} containing the full
  contents of the stream.


## Alternative native methods

[Response](https://developer.mozilla.org/en-US/docs/Web/API/Response?retiredLocale=sv-SE) can be a grate hack to abuse it's feature to convert mostly anything else
without the need for this library.
`new Response(new ReadableStream({...})).json()`

But this can't work with async iterator or `node:streams` that's when you should be using this utility stream consumers that all accepts async iterators.
