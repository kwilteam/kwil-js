import {Transaction, TxBody} from "../core/tx";
import {GenericResponse} from "../core/resreq";
import {Kwil} from "./kwil";
import {objects} from "../utils/objects";

const key = Symbol();

export function unwrap<T>(kwil: Kwil): ((tx: Transaction<TxBody>) => Promise<GenericResponse<string>>) {
    objects.requireNonNil(kwil);
    return objects.requireNonNil((kwil as any)[key]);
}

export function wrap<T>(kwil: Kwil, method: (tx: Transaction<TxBody>) => Promise<GenericResponse<string>>): void {
    objects.requireNonNil(kwil);
    (kwil as any)[key] = method
}
