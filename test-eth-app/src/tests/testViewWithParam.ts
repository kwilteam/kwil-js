import { Utils, WebKwil } from '@lukelamey/kwil-js';

export async function testViewWithParam(kwil: WebKwil, dbid: string): Promise<void> {
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