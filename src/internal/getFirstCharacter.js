    const getFirstCharacter = (_username) => {
        let validStarters = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","1","2","3","4","5","6","7","8","9"]
        if (validStarters.includes(_username[0].toUpperCase())){
            return _username[0].toUpperCase()
        }
        else {
            return 'OTHER'
        }
    }

    export default getFirstCharacter