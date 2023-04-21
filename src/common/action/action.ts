import { ethers, JsonRpcSigner } from "ethers";
import { PayloadType } from "../interfaces/tx";
import { AnyMap } from "../../utils/anyMap";
import { bytesToBase64 } from "../../utils/base64";
import Client from "../client/client";
import { DataType, inputToDataType } from "../interfaces/enums";
import { ITx } from "../interfaces/tx";
import { marshal } from "../marshal";
import { Transaction } from "../transactions/transaction";

type NewAction = Record<any, any>

export class Action {
    private readonly dbid: string;
    private readonly name: string;
    private client: Client;
    public inputs?: string[];
    public actions?: AnyMap<any>[]

    constructor(dbid: string, name: string, client: Client) {
        this.dbid = dbid;
        this.name = name;
        this.client = client
    }

    //init to get the action inputs
    public async init(): Promise<void> {
        const schema = await this.client.Accounts.getSchema(this.dbid);
        if(!schema.data || !schema.data.actions) {
            throw new Error(`Could not retrieve actions for database ${this.dbid}. Please double check that you have the correct DBID.`);
        }
        for(const action of schema.data.actions) {
            if(action.name == this.name) {
                this.inputs = action.inputs;
                return;
            }
        }
        if(!this.inputs) {
            throw new Error(`Could not find action ${this.name} in database ${this.dbid}. Please double check that you have the correct DBID and action name.`);
        }
    }

    public newInstance(): AnyMap<any> {
        const action = new AnyMap<any>();
        this.actions = [...(this.actions ?? []), action];
        return action;
    }

    
    public bulk(bulkActions: NewAction[]) {
        for (const action of bulkActions) {
            const newAction = this.newInstance();
            for (const key in action) {
                newAction.set(key, action[key]);
            }
        }
    }

    public isComplete(): boolean {
        if(!this.actions) {
            throw new Error("No actions have been created. Please call newAction() before calling isComplete().")
        }
        for(const action of this.actions) {
            if(!this.inputs) {
                throw new Error("Action inputs have not been initialized. Please call init() before calling isComplete().")
            }

            for (const input of this.inputs) {
                if(!action.get(input)) {
                    return false;
                }
            }
        }
        return true;
    }

    public async prepareAction(signer: JsonRpcSigner | ethers.Wallet): Promise<Transaction> {
        //serialize action values
        if(!this.actions && this.inputs) {
            throw new Error("No action inputs have been set. Please call newAction() or bulkAction() before calling prepareTx().")
        }

        let actions = []

        if(this.actions) {
            for(const action of this.actions) {
                const inputs = action.map
                for (const val in inputs) {
                    const dataType = inputToDataType(inputs[val]) as DataType;
                    const encodedValue = bytesToBase64(marshal(inputs[val], dataType));
                    inputs[val] = encodedValue;
                }
            }
   
            actions = this.actions.map((action) => {
                return action.map
            })
        }
        
        const payload = {
            "action": this.name,
            "dbid": this.dbid,
            "params": actions
        }
        //create transaction
        const readyTx = {
            toObject: () => payload,
            payloadType: PayloadType.EXECUTE_ACTION
        }
        
        const tx = new Transaction(readyTx)

        //sign transaction
        tx.tx.sender = (await signer.getAddress()).toLowerCase();
       
        const acct = await this.client.Accounts.getAccount(tx.tx.sender);
        if (acct.status != 200 || !acct.data) {
            throw new Error(`Could not retrieve account ${tx.tx.sender}. Please double check that you have the correct account address.`);
        }
        const cost = await this.client.Tx.estimateCost(tx.tx as ITx);
        if (cost.status != 200 || !cost.data) {
            throw new Error(`Could not retrieve estimated cost for transaction. Please try again later.`);
        }

        tx.tx.fee = cost.data;
        tx.tx.nonce = Number(acct.data.nonce) + 1;

        tx.generateHash();
        await tx.sign(signer);
        return tx;
    }
}