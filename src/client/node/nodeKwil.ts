import { Config } from "../../api_client/config";
import { Kwil } from "../kwil";

export class NodeKwil extends Kwil {
    constructor(opts: Config) {
        super(opts);
    }
}