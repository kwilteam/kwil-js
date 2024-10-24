// function that separates
// *big numbers* from *small* ones
//
// (works for input parameter num of type number/string)
// null is accounted for because of the regex

const isBigNumber = (num: number | string | null): boolean => {
    if (num === null) {
        return false;
    }

    if (typeof num === 'number') {
        return +num >= Number.MAX_SAFE_INTEGER || +num <= Number.MIN_SAFE_INTEGER;
    }

    if (typeof num === 'string') {
        return num.length > Number.MAX_SAFE_INTEGER.toString().length || num.length > Number.MIN_SAFE_INTEGER.toString().length;
    }

    return false;
}

// function that checks if a number is a decimal
// (works for input parameter num of type number/string)
// null is accounted for because of the regex
const isDecimal = (num: number | string | null): boolean => {
    if (num === null) {
        return false;
    }

    if (typeof num === 'number') {
        return Number.isInteger(num);
    }

    if (typeof num === 'string') {
        return num.includes('.');
    }

    return false;
}

// on some machines, our bytesToString function already has the appropriate quotes,
// so we need to remove the extra quotes that we add in the bytesToString function
const removeExtraDoubleQuotes = (jsonString: string) => {
    return jsonString.replace(/""([^"]+)""/g, '"$1"');
};

// function that enquotes numbers that are not safe or
// are decimals in a JSON string
// this helps us clean up the JSON string before parsing

const enquoteBigNumOrDecimal = (jsonString: string) =>
    jsonString.replaceAll(
        /([:\s\[,]*)(\d+(?:\.\d+)?)([\s,\]]*)/g,
        (matchingSubstr, prefix, num, suffix) => 
            isBigNumber(num) || isDecimal(num)
                ? `${prefix}"${num}"${suffix}`
                : matchingSubstr
    );


// parser that turns matching *big numbers* in
// source JSON string to bigint
export const parseWithSafeInt = (jsonString: string) => 
    JSON.parse(removeExtraDoubleQuotes(enquoteBigNumOrDecimal(jsonString)));