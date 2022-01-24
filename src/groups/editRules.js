import getGroupData from "./getGroupData.js"
import { gateway } from '../gateway.js'
import sign from "../internal/sign.js"
import rs from 'jsrsasign'
import axios from 'axios'

const editRules = async (_rules, _group, _username, _privateKey) => {
    if (!Array.isArray(_rules)) {
        throw new Error('Rules must be an array')
    }

    _username = _username.toLowerCase()
    _group = _group.toUpperCase()

    const groupData = await getGroupData(_group)
    groupData.rules = _rules
    const _time = new Date
    groupData.timestamp = _time
    const changed = {
        rules: _rules,
        post_time: _time
    }

    const _url = gateway + `/editGroup`;
    const params = {
        url: _url,
        method: 'post',
        timeout: 20000,
        data: {
            data: groupData,
            changed: changed,
            signator: {signature: sign(JSON.stringify(groupData), rs.KEYUTIL.getKey(_privateKey)), username: _username}
        },
    };
    const response = await axios(params);
    return response.data
}

export default editRules