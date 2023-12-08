// for RLP-encoding, we need to ensure that the order of the object is the same as the Go struct that is being encoded.

import { NonNil } from "../utils/types";
import { Database } from "./database";

export function enforceDatabaseOrder(db: NonNil<Database>): NonNil<Database> {
    return {
        owner: db.owner,
        name: db.name,
        tables: db.tables && db.tables.length > 0 ? db.tables?.map(table => {
            return {
                name: table.name,
                columns: table.columns && table.columns.length > 0 ? table.columns?.map(column => {
                    return {
                        name: column.name,
                        type: column.type,
                        attributes: column.attributes?.map(attribute => {
                            return {
                                type: attribute.type,
                                value: attribute.value,
                            }
                        }),
                    }
                }) : [],
                indexes: table.indexes && table.indexes.length > 0 ? table.indexes?.map(index => {
                    return {
                        name: index.name,
                        columns: index.columns,
                        type: index.type,
                    }
                }): [],
                foreign_keys: table.foreign_keys && table.foreign_keys.length > 0 ? table.foreign_keys?.map(foreignKey => {
                    return {
                        child_keys: foreignKey.child_keys,
                        parent_keys: foreignKey.parent_keys,
                        parent_table: foreignKey.parent_table,
                        actions: foreignKey.actions && foreignKey.actions.length > 0 ? foreignKey.actions?.map(action => {
                            return {
                                on: action.on,
                                do: action.do,
                            }
                        }) : [],
                    }
                }) : [],
            }
        }) : [],
        actions: db.actions && db.actions.length > 0 ? db.actions?.map(action => {
            return {
                name: action.name,
                annotations: action.annotations,
                inputs: action.inputs,
                mutability: action.mutability,
                auxiliaries: action.auxiliaries,
                public: action.public,
                statements: action.statements,
            }
        }): [],
        extensions: db.extensions && db.extensions.length > 0 ? db.extensions?.map(extension => {
            return {
                name: extension.name,
                config: extension.config && extension.config.length > 0 ? extension.config?.map(config => {
                    return {
                        argument: config.argument,
                        value: config.value,
                    }
                }): [],
                alias: extension.alias,
            }
        }) : [],
    }
}