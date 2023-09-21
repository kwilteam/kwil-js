import { Utils } from '../../../dist/index';

export async function executeAction(kwil, dbid, action, signer, wallet, pubKey) {
    const query = await kwil.selectQuery(dbid, "SELECT COUNT(*) FROM posts");
    console.log(query)
    const count = query.data[0][`COUNT(*)`]

    const actionInput = Utils.ActionInput
        .of()
        .put("$id", count + 1)
        .put("$user", "Luke")
        .put("$title", "Hello")
        .put("$body", "Hello World")
    
    const tx = await kwil
        .actionBuilder()
        .dbid(dbid)
        .name(action)
        .concat(actionInput)
        .publicKey(pubKey)
        .signer(signer, 'ed25519_nr')
        .buildTx();

    const res = await kwil.broadcast(tx)
    console.log(res)
}