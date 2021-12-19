import assert from 'node:assert'
import { PassThrough } from 'node:stream'

import { arrayBuffer, blob, text, json } from './mod.js'

process.emitWarning = () => {}

const buf = new TextEncoder().encode('hellothere')
const kArrayBuffer = buf.buffer;

// TODO: remove async wrapper once VSCode understands that
// top level await is supported and when dynamic import is supported in node
(async () => {
  const { TransformStream } = await import('node:stream/web').catch(() => ({}))

  {
    const passthrough = new PassThrough()
    passthrough.write('hello')
    passthrough.end('there')

    const chunk = await blob(passthrough)
    assert.strictEqual(chunk.size, 10)
    assert.deepStrictEqual(await chunk.arrayBuffer(), kArrayBuffer)
  }

  {
    const passthrough = new PassThrough()
    passthrough.write('hello')
    passthrough.end('there')

    const ab = await arrayBuffer(passthrough)
    assert.strictEqual(ab.byteLength, 10)
    assert.deepStrictEqual(ab, kArrayBuffer)
  }

  {
    const passthrough = new PassThrough()
    passthrough.write('hello')
    passthrough.end('there')

    const str = await text(passthrough)
    assert.strictEqual(str.length, 10)
    assert.deepStrictEqual(str, 'hellothere')
  }

  {
    const passthrough = new PassThrough()
    passthrough.write('"hello')
    passthrough.end('there"')

    const str = await json(passthrough)
    assert.strictEqual(str.length, 10)
    assert.deepStrictEqual(str, 'hellothere')
  }

  if (TransformStream) {
    {
      const { writable, readable } = new TransformStream()
      const writer = writable.getWriter()
      writer.write('hello')
      writer.write('there')
      // Hmm, for some reason this fail if i don't use
      // await but the one below works with ab
      await writer.close()

      const chunk = await blob(readable)
      assert.strictEqual(chunk.size, 10)
      assert.deepStrictEqual(await chunk.arrayBuffer(), kArrayBuffer)
      assert.rejects(blob(readable), { code: 'ERR_INVALID_STATE' })
    }

    {
      const { writable, readable } = new TransformStream()
      const writer = writable.getWriter()
      writer.write('hello')
      writer.write('there')
      writer.close()

      const ab = await arrayBuffer(readable)
      assert.strictEqual(ab.byteLength, 10)
      assert.deepStrictEqual(ab, kArrayBuffer)
      assert.rejects(arrayBuffer(readable), { code: 'ERR_INVALID_STATE' })
    }

    {
      const { writable, readable } = new TransformStream()
      const writer = writable.getWriter()
      writer.write('hello')
      writer.write('there')
      writer.close()

      const str = await text(readable)
      assert.strictEqual(str.length, 10)
      assert.deepStrictEqual(str, 'hellothere')
      assert.rejects(text(readable), { code: 'ERR_INVALID_STATE' })
    }

    {
      const { writable, readable } = new TransformStream()
      const writer = writable.getWriter()
      writer.write('"hello')
      writer.write('there"')
      writer.close()

      const str = await json(readable)
      assert.strictEqual(str.length, 10)
      assert.deepStrictEqual(str, 'hellothere')
      assert.rejects(json(readable), { code: 'ERR_INVALID_STATE' })
    }

    {
      const stream = new TransformStream()
      const writer = stream.writable.getWriter()
      writer.write(new Uint8Array([0xe2]))
      writer.write(new Uint8Array([0x82]))
      writer.close()

      const str = await text(stream.readable)
      // Incomplete utf8 character is flushed as a replacement char
      assert.strictEqual(str.charCodeAt(0), 0xfffd)
    }
  }

  {
    const stream = new PassThrough({
      readableObjectMode: true,
      writableObjectMode: true
    })
    stream.write({})
    stream.end({})

    const chunk = await blob(stream)
    assert.strictEqual(chunk.size, 30)
  }

  {
    const stream = new PassThrough({
      readableObjectMode: true,
      writableObjectMode: true
    })
    stream.write({})
    stream.end({})

    const ab = await arrayBuffer(stream)
    assert.strictEqual(ab.byteLength, 30)
    assert.strictEqual(
      new TextDecoder().decode(ab),
      '[object Object][object Object]'
    )
  }

  {
    const stream = new PassThrough({
      readableObjectMode: true,
      writableObjectMode: true
    })
    stream.write({})
    stream.end({})

    await assert.rejects(text(stream), {
      code: 'ERR_INVALID_ARG_TYPE'
    })
  }

  {
    const stream = new PassThrough({
      readableObjectMode: true,
      writableObjectMode: true
    })
    stream.write({})
    stream.end({})

    await assert.rejects(json(stream), {
      code: 'ERR_INVALID_ARG_TYPE'
    })
  }
})()
