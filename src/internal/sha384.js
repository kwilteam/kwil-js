import jssha from 'jssha'

const sha384 = (_text) => {
    const shaObj = new jssha('SHA-384', 'TEXT', {encoding: 'UTF8'})
    shaObj.update(_text)
    return shaObj.getHash("B64")
}

export default sha384