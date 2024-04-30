// for RLP-encoding, we need to ensure that the order of the object is the same as the Go struct that is being encoded.

import { NonNil } from "../utils/types";
import { Database } from "./database";

export function enforceDatabaseOrder(db: NonNil<Database>): NonNil<Database> {
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
                    return {
                        name: parameter.name,
                        type: parameter.type,
                    }
                }) : [],
                public: procedure.public,
                modifiers: procedure.modifiers,
                body: procedure.body,
                return_types: {
                    is_table: procedure.return_types.is_table,
                    fields: procedure.return_types.fields && procedure.return_types.fields.length > 0 ? procedure.return_types.fields?.map(field => {
                        return {
                            name: field.name,
                            type: {
                                name: field.type.name,
                                is_array: field.type.is_array,
                            }
                        }
                    }) : [],
                },
                annotations: procedure.annotations,
            }
        }) : [],
    }
}