import axios from 'axios'

const isHolder = async (_holderAddress, _contractAddress) => {
    const response = await axios(`https://api.opensea.io/api/v1/assets?owner=${_holderAddress}&asset_contract_address=${_contractAddress}&order_direction=desc&offset=0&limit=20`)
    
    if (response.data.assets.length > 0) {
        return true
    } else {
        return false
    }
//https://api.opensea.io/api/v1/assets?owner=MY_ADDRESS&asset_contract_address=CONTRACT_ADDR&order_direction=desc&offset=0&limit=20
//0xdf9a82dae6939590149550c135e206d8cdc9f19b
//0xdf9a82dae6939590149550c135e206d8cdc9f19b

//0x4ca6b786b406e9cd072acdacad96c707691fe795
//0xbfcd68ded9d511a632d45333155350a1907d4977
}

export default isHolder