const hashPath = (_string) => {
    //Feed this function a hash
    let _path = '/'
    for (let i=0;i<5;i++) {
        _path = _path + _string[i] + '/'
    }
    return _path
}
export default hashPath