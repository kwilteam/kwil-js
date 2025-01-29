import { Entries } from '../core/action';
import { VarType } from '../core/enums';
import { EncodedValue } from '../core/payload';
import { AccessModifier, NamespaceAction, ValidatedAction } from '../transaction/action';
import { encodeValue } from './kwilEncoding';
import { analyzeNumber } from './parameters';

/**
 * Functions for validating and encoding action inputs
 * @internal
 */
const ActionValidator = {
  /**
   * Validates an action request and encodes its inputs
   * @param {string} namespace - The namespace of the action
   * @param {string} actionName - The name of the action to validate
   * @param {Entries[]} actionInputs - Array of action input entries to validate
   * @returns {Promise<ValidatedAction>} Object containing validated and encoded action data
   * @throws {Error} If validation fails or action is not found
   */
  async validateActionRequest(
    namespace: string,
    actionName: string,
    actionInputs: Entries[]
  ): Promise<ValidatedAction> {
    // retrieve the schema for the database
    // const namespaceRequest = await this.kwil.getActions(this.namespace);
    // TODO: Temp for testing before implementing kwilSigner for selectQuery

    const namespaceRequest = {
      status: 200,
      data: [
        {
          namespace: 'test',
          name: 'call_name',
          raw_statement:
            '{test}CREATE ACTION call_name($name text) public view returns (name text) { return $name; };',
          access_modifiers: ['PUBLIC', 'VIEW'],
          parameter_names: ['$name'],
          parameter_types: ['text'],
          return_names: ['name'],
          return_types: ['text'],
          returns_table: false,
          built_in: false,
        },
        {
          namespace: 'test',
          name: 'insert_variables',
          raw_statement:
            '{test}CREATE OR REPLACE ACTION insert_variables($id uuid, $int_var integer, $text_var text, $bool_var boolean, $decimal_var numeric(5,2), $blob blob) public returns table(id uuid, int_var integer, text_var text, bool_var boolean, decimal_var numeric(5,2), blob_var blob) {INSERT INTO variable_test (id, int_var, text_var, bool_var, decimal_var, blob_var) VALUES ($id, $int_var, $text_var, $bool_var, $decimal_var, $blob); return SELECT * FROM variable_test; };',
          access_modifiers: ['PUBLIC'],
          parameter_names: ['$id', '$int_var', '$text_var', '$bool_var', '$decimal_var', '$blob'],
          parameter_types: ['uuid', 'int8', 'text', 'bool', 'numeric(5,2)', 'bytea'],
          return_names: ['id', 'int_var', 'text_var', 'bool_var', 'decimal_var', 'blob_var'],
          return_types: ['uuid', 'int8', 'text', 'bool', 'numeric(5,2)', 'bytea'],
          returns_table: true,
          built_in: false,
        },
      ],
    };

    // Check if the request was successful
    if (namespaceRequest.status !== 200) {
      throw new Error(
        `Failed to retrieve actions for namespace ${namespace}. Status: ${namespaceRequest.status}`
      );
    }

    console.log(namespace, actionName, actionInputs);

    // Check if namespace has actions
    if (!namespaceRequest.data || namespaceRequest.data.length === 0) {
      throw new Error(
        `No actions found for the namespace '${namespace}'. Please verify the namespace exists and contains the '${actionName}' action.`
      );
    }

    const namespaceActions = namespaceRequest.data as NamespaceAction[];

    // Find the action matching the requested name
    const selectedAction = namespaceActions.find((a) => a.name === actionName);
    if (!selectedAction) {
      throw new Error(`Action '${actionName}' not found in namespace '${namespace}'.`);
    }

    // Validate that the action is public
    if (!selectedAction.access_modifiers.includes(AccessModifier.PUBLIC)) {
      throw new Error(`Action '${actionName}' is not a public action.`);
    }

    // ensure that no action inputs or values are missing
    if (actionInputs) {
      for (const actionInput of actionInputs) {
        if (!this.validateInputs(actionName, selectedAction, actionInput)) {
          // Should not reach this point as error is thrown in validateInputs
          throw new Error(`Action inputs are invalid for action: ${selectedAction.name}.`);
        }
      }

      const encodedActionInputs = this.encodeInputs(actionName, selectedAction, actionInputs);

      console.log('encodedActionInputs', encodedActionInputs);

      return {
        namespace: selectedAction.namespace,
        actionName: selectedAction.name,
        modifiers: selectedAction.access_modifiers,
        encodedActionInputs,
      };
    }

    return {
      namespace: selectedAction.namespace,
      actionName: selectedAction.name,
      modifiers: selectedAction.access_modifiers,
      encodedActionInputs: [],
    };
  },

  /**
   * Validates that all required action inputs are present and correct
   * @param {string} actionName - Name of the action being validated
   * @param {NamespaceAction} selectedAction - The action schema to validate against
   * @param {Entries} actionInputEntries - The input entries to validate
   * @returns {boolean} True if validation passes
   * @throws {Error} If validation fails
   */
  validateInputs: (
    actionName: string,
    selectedAction: NamespaceAction,
    actionInputEntries: Entries
  ): boolean => {
    const actionInputKeys = Object.keys(actionInputEntries);

    // if action does not require parameters, return true
    if (
      (!selectedAction.parameter_names || selectedAction.parameter_names.length === 0) &&
      actionInputEntries.length === 0
    ) {
      return true;
    }

    // throw runtime error if action does not have any parameters but inputs were provided
    if (
      (!selectedAction.parameter_names || selectedAction.parameter_names.length === 0) &&
      actionInputEntries.length !== 0
    ) {
      throw new Error(`No parameters found for action: ${actionName}.`);
    }

    // throw runtime error if no actionInputs were provided but are required
    if (actionInputEntries.length == 0 && selectedAction.parameter_names.length > 0) {
      throw new Error(
        `No action parameters have been included. Required parameters: ${selectedAction.parameter_names.join(
          ', '
        )}`
      );
    }

    // Check to see if the actionInputs match the expected selectedAction parameters
    const missingParameters = new Set<string>();
    selectedAction.parameter_names.forEach((parameterName) => {
      if (!actionInputKeys.includes(parameterName)) {
        missingParameters.add(parameterName);
      }
    });

    if (missingParameters.size > 0) {
      throw new Error(
        `Missing parameters: ${Array.from(missingParameters).join(', ')} for action '${
          selectedAction.name
        }'`
      );
    }

    const incorrectParameters = new Set<string>();
    actionInputKeys.forEach((actionInputKey) => {
      if (
        !selectedAction.parameter_names.some((parameterName) => actionInputKey === parameterName)
      ) {
        incorrectParameters.add(actionInputKey);
      }
    });

    if (incorrectParameters.size > 0) {
      throw new Error(
        `Incorrect parameters: ${Array.from(incorrectParameters).join(', ')} for action '${
          selectedAction.name
        }'`
      );
    }

    return true;
  },

  /**
   * Encodes action inputs according to their parameter types
   * @param {string} actionName - Name of the action
   * @param {NamespaceAction} selectedAction - The action schema containing parameter types
   * @param {Entries[]} actionInputs - Array of input entries to encode
   * @returns {EncodedValue[][]} Array of encoded input values
   * @throws {Error} If encoding fails or parameter types are invalid
   */
  encodeInputs: (
    actionName: string,
    selectedAction: NamespaceAction,
    actionInputs: Entries[]
  ): EncodedValue[][] => {
    const encodedActionInputs: EncodedValue[][] = [];

    for (let i = 0; i < actionInputs.length; i++) {
      const actionObject = actionInputs[i];
      for (const [parameterName, parameterValue] of Object.entries(actionObject)) {
        // Find the array location the parameter name is at from the selectedAction
        const parameterNameIndex = selectedAction.parameter_names.findIndex(
          (name) => name === parameterName
        );
        if (parameterNameIndex === -1) {
          throw new Error(`Parameter ${parameterName} not found in action ${actionName}.`);
        }
        let parameterType = selectedAction.parameter_types[parameterNameIndex] as VarType;

        // Add to array
        encodedActionInputs[i] = encodedActionInputs[i] || [];

        // Set metadata for all types
        let metadata: number[] = [0, 0];
        // Set metadata for numeric types
        // Decimal is now deprecated and should be replaced with numeric but keeping for compatibility right now
        if (parameterType.includes('numeric') || parameterType.includes('decimal')) {
          parameterType = VarType.NUMERIC;
          const analysis = analyzeNumber(Number(parameterValue));
          metadata = [analysis.precision, analysis.scale];
        }

        // Validate parameter type against VarType enum
        if (!Object.values(VarType).includes(parameterType)) {
          // This shouldn't happen as we are using the parameter type from the action definition
          throw new Error(
            `Invalid parameter type '${parameterType}' for action '${actionName}' parameter '${parameterName}'.  Please report this error to the Kwil team.`
          );
        }

        encodedActionInputs[i].push({
          type: {
            name: parameterType,
            is_array: false, // TODO: Need to update to handle arrays
            metadata,
          },
          data: [encodeValue(parameterValue)],
        });
      }
    }

    return encodedActionInputs;
  },
};

export default ActionValidator;
