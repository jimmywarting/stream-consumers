/*! stream-consumers. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */

/**
 * Util fn to create iterator from web
 * ReadableStream that lacks Symbol.asyncIterator
 * @param {ReadableStream|AsyncIterable} iterable
 */
function stream2iterator (iterable) {
  // Duck checking without actually depending on whatwg streams
  if (
    iterable &&
    !iterable[Symbol.asyncIterator] &&
    iterable.constructor?.name === 'ReadableStream'
  ) {
    return (async function * () {
      const reader = iterable.getReader()
      while (1) {
        const chunk = await reader.read()
        if (chunk.done) return chunk.value
        yield chunk.value
      }
    })()
  }
  return iterable
}

let Blob = globalThis.Blob

/**
 * You can assign this value yourself if you want to support buffer()
 * @type {BufferConstructor | undefined}
 */
export let Buffer

/**
 * Fulfills with an ArrayBuffer containing the full contents of the stream.
 * @param {ReadableStream|AsyncIterable} iterable
 */
export async function arrayBuffer (iterable) {
  let i = 0
  const chunks = []
  for await (const chunk of stream2iterator(iterable)) {
    i += chunk.byteLength
    chunks.push(chunk)
  }

  const array = new Uint8Array(i)
  i = 0
  for (const chunk of chunks) {
    array.set(chunk, i)
    i += chunk.byteLength
  }
  return array.buffer
}

/**
 * Fulfills with a <Blob> containing the full contents of the stream.
 * @param {ReadableStream|AsyncIterable} iterable
 */
export async function blob (iterable) {
  const chunks = []
  if (!Blob) {
    // presumably we're in a NodeJS
    const { version } = await import('node:os')
    const Buf = await import('node:buffer')
    if (Buf.Blob && Buf.Blob.prototype.stream) {
      Blob = Buf.Blob
    } else {
      Blob = (await import('fetch-blob')).default
    }
  }
  for await (const chunk of stream2iterator(iterable)) {
    chunks.push(chunk)
  }
  return new Blob(chunks)
}

/**
 * NodeJS only feature.
 * Best avoided for better cross comparability
 * with Deno And Browsers. Use arrayBuffer() instead.
 * @param {ReadableStream|AsyncIterable} iterable
 */
export async function buffer (iterable) {
  if (!Buffer) {
    Buffer = (await import('node:buffer')).Buffer
  }
  const ab = await arrayBuffer(iterable)
  return Buffer.from(ab)
}

/**
 * Fulfills with the contents of the stream parsed as a UTF-8 encoded string.
 * @param {ReadableStream|AsyncIterable} iterable
 */
export async function text (iterable) {
  let str = ''
  const textDecoder = new TextDecoder()
  for await (const chunk of stream2iterator(iterable)) {
    str += typeof chunk === 'string'
      ? chunk
      : textDecoder.decode(chunk, { stream: true })
  }
  str += textDecoder.decode() // flush
  return str
}

/**
 * Fulfills with the contents of the stream parsed as a UTF-8
 * encoded string that is then passed through JSON.parse()
 * @param {ReadableStream|AsyncIterable} iterable
 */
export function json (iterable) {
  return text(iterable).then(JSON.parse)
}
