// for RLP-encoding, we need to ensure that the order of the object is the same as the Go struct that is being encoded.

import { NonNil } from "../utils/types";
import { Database, EncodeableDatabase } from "./database";
import { CompiledKuneiform } from "./payload";

export function enforceDatabaseOrder(db: NonNil<EncodeableDatabase>): NonNil<EncodeableDatabase> {
    return {
        name: db.name,
        owner: db.owner,
        extensions: db.extensions && db.extensions.length > 0 ? db.extensions?.map(extension => {
            return {
                name: extension.name,
                initialization: extension.initialization && extension.initialization.length > 0 ? extension.initialization?.map(initialization => {
                    return {
                        name: initialization.name,
                        value: initialization.value,
                    }
                }): [],
                alias: extension.alias,
            }
        }) : [],
        tables: db.tables && db.tables.length > 0 ? db.tables?.map(table => {
            return {
                name: table.name,
                columns: table.columns && table.columns.length > 0 ? table.columns?.map(column => {
                    const metadataSpread = column.type.metadata ? { metadata: column.type.metadata } : {}
                    return {
                        name: column.name,
                        type: {
                            name: column.type.name,
                            is_array: column.type.is_array,
                            ...metadataSpread
                        },
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
                parameters: action.parameters,
                public: action.public,
                modifiers: action.modifiers,
                body: action.body,
            }
        }): [],
        procedures: db.procedures && db.procedures.length > 0 ? db.procedures?.map(procedure => {
            return {
                name: procedure.name,
                parameters: procedure.parameters && procedure.parameters.length > 0 ? procedure.parameters?.map(parameter => {
                    const metadataSpread = parameter.type.metadata ? { metadata: parameter.type.metadata } : {}
                    return {
                        name: parameter.name,
                        type: {
                            name: parameter.type.name,
                            is_array: parameter.type.is_array,
                            ...metadataSpread
                        }
                    }
                }) : [],
                public: procedure.public,
                modifiers: procedure.modifiers,
                body: procedure.body,
                return_types: procedure.return_types,
                annotations: procedure.annotations,
            }
        }) : [],
        foreign_calls: db.foreign_calls && db.foreign_calls.length > 0 ? db.foreign_calls?.map(foreignCall => {
            return {
                name: foreignCall.name,
                parameters: foreignCall.parameters && foreignCall.parameters.length > 0 ? foreignCall.parameters?.map(parameter => {
                    const metadataSpread = parameter.metadata ? { metadata: parameter.metadata } : {}
                    return {
                        name: parameter.name,
                        is_array: parameter.is_array,
                        ...metadataSpread
                    }
                }): [],
                returns: foreignCall.returns
            }
        }): [],
    }
}