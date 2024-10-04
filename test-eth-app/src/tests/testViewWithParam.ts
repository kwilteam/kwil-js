import { Utils, WebKwil } from '../../../src';

export async function testViewWithParam(kwil: WebKwil, dbid: string): Promise<void> {
    const actionInput = Utils.ActionInput
        .of()
        .put("$title", "Hello")

    const res = await kwil.call({
        dbid,
        name: 'view_with_param',
        inputs: [ actionInput ]
    })

    console.log(res)
}