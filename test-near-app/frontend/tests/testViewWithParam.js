import { Utils } from "../../../dist";

export async function testviewWithParam(kwil, dbid) {
    const actionInput = Utils.ActionInput
        .of()
        .put("$id", 1)

    const msg = await kwil
        .actionBuilder()
        .dbid(dbid)
        .name('view_with_param')
        .concat(actionInput)
        .buildMsg()

    const res = await kwil.call(msg);

    console.log(res)
}