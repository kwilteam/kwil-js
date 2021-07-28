import rs from 'jsrsasign'
let jwk = {
  kty: 'RSA',
  n: 'gGh1tbmC09mu21vnFoTQONA3jQPONt8g5O-69DhwKDIOr5xrzrkGLLgWj3iUpaDI7p9MmgGMmxPfbjHlOuY9NQ',
  e: 'AQAB',
  d: 'XX-ydigmQuv2jnNUyOjcVQIH8P4cYYgHA6wrjTirMhh28nSxUfaKqUBfylr1-Q8BXfwD1sQsK3NQL5AbAu4BAQ',
  p: 'zJCaHmMXH3VKdY-bEhvssqIe7cwehdvPtgnALPW4D1k',
  q: 'oLHO_w-peQWQV9qvM2Ca7Lp4CN6U29UHKDfaFIaJnT0',
  dp: 'xj9JLTPI3_LSo1X16bnoTUIyiTBtUDqzdO7EMI49v5k',
  dq: 'FuxmkAIm9emyRqYemiCs2Rpcpz9BUv7Xr4gQJx9uIC0',
  qi: 'rQMoOPrRYaPVWy4gcqrt6UygbWBkmN9oJ1g-RRut4eI'
}

  //let privateKey = rs.KEYUTIL.getKey(jwk)

  export default jwk