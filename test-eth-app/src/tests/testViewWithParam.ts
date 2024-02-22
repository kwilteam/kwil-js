import { Utils, WebKwil } from '../../../src/index';

export async function testViewWithParam(kwil: WebKwil, dbid: string): Promise<void> {
    const actionInput = Utils.ActionInput
        .of()
        .put("$id", 1)

    const res = await kwil.call({
        dbid,
        action: 'view_with_param',
        inputs: [ actionInput ]
    })

    console.log(res)
}