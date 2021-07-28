import rs from 'jsrsasign'
let jwk = {
  kty: 'RSA',
  n: 'gTwBtmcf7tgBoSJ8JIObij1EWnEFkWf0qPyuh0WXEK1Q7jzbYQHx2QtnCY2jXgznXUvrgVwC-83Cylzfwudb6w',
  e: 'AQAB',
  d: 'Pd4KO9YWlXLXJNqrb5eJiJ5X8KwWrEuF9rgwnRWVgieoCkp3yiIgjxLXPLxo-467J433-cQ5GOMyCfVzch2aEQ',
  p: 'wexp30mzEDsBMOVrVnQeArypLAucrblf9ChUrN5C5C8',
  q: 'qpp4YS8R00uqTP3V6ZAACe5SjxeEuT0Ki8N5bTSQyQU',
  dp: 'vOMlIKvtsYJ3n4PncFc8IBhZg6Bv5Tsp_m0GRTdc2ls',
  dq: 'kjGMtrr_K3HLne5nQJ6Faf0wAi7FLXeBcgMwKsTAzYE',
  qi: 'QByYBfMUsn0Hx4sXf_hR5bWRUfY7OJkYsMPokf9Rlnw'
}

  //let privateKey = rs.KEYUTIL.getKey(jwk)

  export default jwk